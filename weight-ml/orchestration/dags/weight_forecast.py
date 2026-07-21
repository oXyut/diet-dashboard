"""ダッシュボードAPIから直接学習・予測する日次Airflow DAG。"""

from __future__ import annotations

import os
from datetime import timedelta

import pendulum
from airflow.sdk import dag, task

from weight_ml.api_client import count_weight_records, fetch_health_data, publish_prediction
from weight_ml.mlflow_pipeline import predict_with_champion, train_and_maybe_promote

TIMEZONE = pendulum.timezone("Asia/Tokyo")
TRACKING_URI = os.environ["MLFLOW_TRACKING_URI"]
API_BASE_URL = os.environ["HEALTH_API_BASE_URL"]
API_KEY = os.environ["HEALTH_API_KEY"]


@dag(
    dag_id="weight_forecast",
    schedule="0 10 * * *",
    start_date=pendulum.datetime(2026, 7, 21, tz=TIMEZONE),
    catchup=False,
    default_args={"retries": 2, "retry_delay": timedelta(minutes=5)},
    tags=["weight", "mlflow"],
)
def weight_forecast() -> None:
    @task
    def fetch() -> list[dict]:
        return fetch_health_data(API_BASE_URL, API_KEY)

    @task
    def train_predict_publish(records: list[dict], logical_date: str | None) -> dict:
        dates = [record["date"] for record in records if isinstance(record.get("date"), str)]
        if not dates:
            raise ValueError("健康データに日付がありません。")
        source_date = max(dates)
        target_date = (pendulum.parse(source_date).date() + timedelta(days=1)).isoformat()
        if count_weight_records(records) < 30:
            payload = {
                "targetDate": target_date,
                "sourceDate": source_date,
                "status": "insufficient_data",
                "predictionKg": None,
                "interpretationKg": None,
                "validationMaeKg": None,
                "modelVersion": None,
                "mlflowRunId": None,
                "topContributions": [],
            }
            publish_prediction(API_BASE_URL, API_KEY, payload)
            return payload

        # 手動実行では logical_date が未指定になる場合があるため、実行時刻を使う。
        # 定期実行は logical_date に従うので、日曜の再学習判定は再現可能なまま維持する。
        run_time = (
            pendulum.now(TIMEZONE)
            if not logical_date or logical_date == "None"
            else pendulum.parse(logical_date).in_timezone(TIMEZONE)
        )
        if run_time.day_of_week == pendulum.SUNDAY:
            train_and_maybe_promote(records, TRACKING_URI)
        payload = predict_with_champion(records, TRACKING_URI)
        if payload is None:
            payload = {
                "targetDate": target_date,
                "sourceDate": source_date,
                "status": "awaiting_training",
                "predictionKg": None,
                "interpretationKg": None,
                "validationMaeKg": None,
                "modelVersion": None,
                "mlflowRunId": None,
                "topContributions": [],
            }
        publish_prediction(API_BASE_URL, API_KEY, payload)
        return payload

    # Airflow 3 の手動実行では logical_date がテンプレート変数に存在しないため、
    # DAG Run オブジェクト経由で安全に渡す。未指定時はタスク側で現在時刻を使う。
    train_predict_publish(fetch(), "{{ dag_run.logical_date or '' }}")


weight_forecast()
