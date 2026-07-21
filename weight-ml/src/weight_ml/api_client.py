"""ダッシュボードAPIからの健康データ取得と予測結果保存。"""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

import requests


class DashboardApiError(RuntimeError):
    """ダッシュボードAPIとの通信・応答に問題がある場合の例外。"""


def _headers(api_key: str) -> dict[str, str]:
    return {"X-API-Key": api_key, "Content-Type": "application/json"}


def fetch_health_data(
    api_base_url: str,
    api_key: str,
    *,
    start: str | None = None,
    end: str | None = None,
    page_size: int = 180,
) -> list[dict[str, Any]]:
    """全ページを昇順で取得する。CSVへの中間出力は行わない。"""

    url = f"{api_base_url.rstrip('/')}/api/ml/health"
    cursor: str | None = None
    collected: list[dict[str, Any]] = []
    while True:
        params = {"limit": str(page_size)}
        if start:
            params["start"] = start
        if end:
            params["end"] = end
        if cursor:
            params["cursor"] = cursor
        response = requests.get(url, headers=_headers(api_key), params=params, timeout=30)
        if not response.ok:
            raise DashboardApiError(f"健康データ取得に失敗しました: HTTP {response.status_code}")
        payload = response.json()
        records = payload.get("data")
        if not isinstance(records, list):
            raise DashboardApiError("健康データAPIの応答形式が不正です。")
        collected.extend(records)
        next_cursor = payload.get("nextCursor")
        if next_cursor is None:
            return collected
        if not isinstance(next_cursor, str) or next_cursor == cursor:
            raise DashboardApiError("健康データAPIのカーソルが不正です。")
        cursor = next_cursor


def publish_prediction(api_base_url: str, api_key: str, payload: dict[str, Any]) -> None:
    """Airflowの再実行でも対象日単位で更新される予測結果を送信する。"""

    url = f"{api_base_url.rstrip('/')}/api/ml/predictions"
    response = requests.post(url, headers=_headers(api_key), json=payload, timeout=30)
    if not response.ok:
        raise DashboardApiError(f"予測結果の保存に失敗しました: HTTP {response.status_code}")


def count_weight_records(records: Iterable[dict[str, Any]]) -> int:
    return sum(1 for record in records if record.get("weight") is not None)
