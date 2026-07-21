"""MLflowの実験追跡・モデル登録・Champion予測を行う処理。"""

from __future__ import annotations

import hashlib
import json
from datetime import timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import joblib
import mlflow
import mlflow.pyfunc
import pandas as pd
from mlflow import MlflowClient

from .data import FEATURE_COLUMNS, build_supervised_dataset, latest_feature_row
from .models import fit_models, global_interpretation, local_interpretation
from .registry import should_promote

EXPERIMENT_NAME = "weight-forecast"
MODEL_NAME = "weight-next-day"


def snapshot_hash(records: list[dict[str, Any]]) -> str:
    canonical = json.dumps(records, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class WeightModelBundle(mlflow.pyfunc.PythonModel):
    """精度モデルと解釈モデルを1バージョンとして登録するMLflowモデル。"""

    def __init__(self, prediction_model: Any, interpretation_model: Any):
        self.prediction_model = prediction_model
        self.interpretation_model = interpretation_model

    def predict(self, context: Any, model_input: pd.DataFrame, params: dict[str, Any] | None = None) -> pd.DataFrame:
        prediction = self.prediction_model.predict(model_input)
        rows = []
        for index, value in enumerate(prediction):
            local = local_interpretation(
                self.interpretation_model, model_input.iloc[[index]], FEATURE_COLUMNS
            )
            rows.append(
                {
                    "prediction_kg": round(float(value), 3),
                    "interpretation_kg": local["prediction_kg"],
                    "top_contributions_json": json.dumps(local["top_contributions"], ensure_ascii=False),
                }
            )
        return pd.DataFrame(rows)


def _set_experiment(tracking_uri: str) -> None:
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(EXPERIMENT_NAME)


def _champion_mae(client: MlflowClient) -> float | None:
    try:
        champion = client.get_model_version_by_alias(MODEL_NAME, "champion")
    except Exception:
        return None
    metric = client.get_run(champion.run_id).data.metrics.get("prediction_model_mae_kg")
    return None if metric is None else float(metric)


def train_and_maybe_promote(records: list[dict[str, Any]], tracking_uri: str) -> dict[str, Any]:
    """APIスナップショットを学習し、改善時だけChampion別名を更新する。"""

    _set_experiment(tracking_uri)
    raw = pd.DataFrame(records)
    dataset = build_supervised_dataset(raw, source="dashboard_api")
    prediction_model, interpretation_model, metrics = fit_models(dataset.features, dataset.target)
    latest_features = latest_feature_row(raw)
    digest = snapshot_hash(records)
    client = MlflowClient(tracking_uri)
    candidate_mae = metrics["prediction_model"]["mae_kg"]

    with mlflow.start_run(run_name="weekly-training") as run:
        mlflow.log_params(
            {
                "training_rows": len(dataset.features),
                "feature_count": len(FEATURE_COLUMNS),
                "data_source": "dashboard_api",
                "snapshot_sha256": digest,
            }
        )
        for model_name, model_metrics in metrics.items():
            mlflow.log_metrics({f"{model_name}_{key}": value for key, value in model_metrics.items()})
        report = {
            "data_source": "dashboard_api",
            "training_rows": len(dataset.features),
            "snapshot_sha256": digest,
            "temporal_holdout_metrics": metrics,
            "global_interpretation": global_interpretation(interpretation_model, FEATURE_COLUMNS),
        }
        mlflow.log_dict({"records": records, "snapshot_sha256": digest}, "input_snapshot.json")
        mlflow.log_dict(report, "training_report.json")
        mlflow.pyfunc.log_model(
            name="model",
            python_model=WeightModelBundle(prediction_model, interpretation_model),
            input_example=latest_features,
        )
        # 監査や個別検証に使えるよう、2つの元モデルも同一Runに保存する。
        with TemporaryDirectory() as artifact_dir:
            artifact_path = Path(artifact_dir)
            joblib.dump(prediction_model, artifact_path / "prediction_model.joblib")
            joblib.dump(interpretation_model, artifact_path / "interpretation_model.joblib")
            mlflow.log_artifacts(artifact_dir, "components")
        run_id = run.info.run_id

    registered = mlflow.register_model(f"runs:/{run_id}/model", MODEL_NAME)
    champion_mae = _champion_mae(client)
    promoted = should_promote(candidate_mae, champion_mae)
    if promoted:
        client.set_registered_model_alias(MODEL_NAME, "champion", registered.version)
    return {
        "run_id": run_id,
        "model_version": str(registered.version),
        "candidate_mae_kg": candidate_mae,
        "champion_mae_kg_before": champion_mae,
        "promoted": promoted,
    }


def predict_with_champion(records: list[dict[str, Any]], tracking_uri: str) -> dict[str, Any] | None:
    """Championが存在する場合だけ予測し、日次Runにもデータ来歴を残す。"""

    _set_experiment(tracking_uri)
    raw = pd.DataFrame(records)
    features = latest_feature_row(raw)
    client = MlflowClient(tracking_uri)
    try:
        champion = client.get_model_version_by_alias(MODEL_NAME, "champion")
    except Exception:
        return None

    with mlflow.start_run(run_name="daily-prediction") as run:
        digest = snapshot_hash(records)
        mlflow.log_params({"data_source": "dashboard_api", "snapshot_sha256": digest, "model_version": champion.version})
        mlflow.log_dict({"records": records, "snapshot_sha256": digest}, "input_snapshot.json")
        model = mlflow.pyfunc.load_model(f"models:/{MODEL_NAME}@champion")
        result = model.predict(features).iloc[0]
        validation_mae = client.get_run(champion.run_id).data.metrics.get("prediction_model_mae_kg")
        source_date = pd.to_datetime(raw["date"]).max().date()
        target_date = source_date + timedelta(days=1)
        return {
            "targetDate": target_date.isoformat(),
            "sourceDate": source_date.isoformat(),
            "status": "ready",
            "predictionKg": float(result["prediction_kg"]),
            "interpretationKg": float(result["interpretation_kg"]),
            "validationMaeKg": None if validation_mae is None else float(validation_mae),
            "modelVersion": str(champion.version),
            "mlflowRunId": run.info.run_id,
            "topContributions": json.loads(result["top_contributions_json"])[:5],
        }
