"""学習用CLI。実データがなければ、明示的なデモデータで動作確認する。"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib

from .data import FEATURE_COLUMNS, build_supervised_dataset, latest_feature_row, load_health_csv, make_synthetic_health_data
from .models import fit_models, global_interpretation, local_interpretation


def train(input_path: Path | None, output_dir: Path, synthetic_days: int = 240) -> dict:
    """2種類のモデルを学習して、モデル・評価・解釈を出力する。"""

    if input_path is None:
        raw_data = make_synthetic_health_data(days=synthetic_days)
        source = "synthetic_demo"
    else:
        raw_data = load_health_csv(input_path)
        source = f"csv:{input_path.name}"

    dataset = build_supervised_dataset(raw_data, source=source)
    prediction_model, interpretation_model, metrics = fit_models(dataset.features, dataset.target)
    latest_features = latest_feature_row(raw_data)

    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(prediction_model, output_dir / "prediction_model.joblib")
    joblib.dump(interpretation_model, output_dir / "interpretation_model.joblib")
    report = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data_source": source,
        "warning": (
            "合成データでのデモ結果です。実測データの予測精度・健康上の因果を示すものではありません。"
            if source == "synthetic_demo"
            else None
        ),
        "training_rows": len(dataset.features),
        "feature_columns": FEATURE_COLUMNS,
        "temporal_holdout_metrics": metrics,
        "latest_day": {
            "prediction_model_next_day_kg": round(float(prediction_model.predict(latest_features)[0]), 3),
            "interpretation_model": local_interpretation(interpretation_model, latest_features, FEATURE_COLUMNS),
        },
        "global_interpretation": global_interpretation(interpretation_model, FEATURE_COLUMNS),
    }
    (output_dir / "training_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="翌日体重の予測・解釈モデルを学習します。")
    parser.add_argument("--input", type=Path, help="健康データCSV。省略時は合成データでデモ実行します。")
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts"), help="出力先ディレクトリ")
    parser.add_argument("--synthetic-days", type=int, default=240, help="デモ用合成データの日数")
    args = parser.parse_args()
    report = train(args.input, args.output_dir, args.synthetic_days)
    mode = "デモ（合成データ）" if report["data_source"] == "synthetic_demo" else "実データ"
    print(f"学習完了: {mode} / {report['training_rows']} 行")
    print(f"精度優先モデル MAE: {report['temporal_holdout_metrics']['prediction_model']['mae_kg']} kg")
    print(f"出力: {args.output_dir / 'training_report.json'}")


if __name__ == "__main__":
    main()
