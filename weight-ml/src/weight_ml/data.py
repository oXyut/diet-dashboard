"""ダッシュボードの健康データを学習データへ整形する処理。"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd


RAW_COLUMNS = [
    "date",
    "weight",
    "bodyFatPercentage",
    "muscleMass",
    "steps",
    "activeCalories",
    "restingCalories",
    "totalCalories",
    "dietaryCalories",
    "proteinG",
    "fatG",
    "carbohydrateG",
    "fiberG",
    "sugarG",
    "sodiumMg",
]

FEATURE_COLUMNS = [
    "weight",
    "weight_7d_mean",
    "weight_7d_change",
    "bodyFatPercentage",
    "muscleMass",
    "steps",
    "activeCalories",
    "restingCalories",
    "totalCalories",
    "dietaryCalories",
    "calorie_balance",
    "proteinG",
    "fatG",
    "carbohydrateG",
    "fiberG",
    "sugarG",
    "sodiumMg",
    "weekday_sin",
    "weekday_cos",
]


@dataclass(frozen=True)
class PreparedDataset:
    """学習可能な特徴量・目的変数と、入力の来歴。"""

    features: pd.DataFrame
    target: pd.Series
    source: str


def _normalise_raw_data(frame: pd.DataFrame) -> pd.DataFrame:
    missing = {"date", "weight"} - set(frame.columns)
    if missing:
        raise ValueError(f"CSVに必須列がありません: {', '.join(sorted(missing))}")

    data = frame.copy()
    data["date"] = pd.to_datetime(data["date"], errors="coerce")
    data = data.dropna(subset=["date"]).sort_values("date").drop_duplicates("date", keep="last")
    for column in RAW_COLUMNS:
        if column not in data.columns:
            data[column] = np.nan
        elif column != "date":
            data[column] = pd.to_numeric(data[column], errors="coerce")
    return data.loc[:, RAW_COLUMNS].reset_index(drop=True)


def load_health_csv(path: Path) -> pd.DataFrame:
    """ダッシュボード互換のCSVを読み込む。"""

    return _normalise_raw_data(pd.read_csv(path))


def make_synthetic_health_data(days: int = 240, seed: int = 42) -> pd.DataFrame:
    """動作確認専用の疑似データを作る。実測精度の根拠には使わない。"""

    if days < 30:
        raise ValueError("合成データは30日以上で作成してください。")

    rng = np.random.default_rng(seed)
    dates = pd.date_range(end=pd.Timestamp.today().normalize(), periods=days, freq="D")
    weekend = dates.dayofweek >= 5
    steps = np.clip(rng.normal(8_100, 2_100, days) - weekend * 700, 1_500, 18_000)
    total_calories = np.clip(2_170 + (steps - 8_000) * 0.035 + rng.normal(0, 90, days), 1_650, 3_100)
    dietary_calories = np.clip(1_900 + weekend * 180 + rng.normal(0, 170, days), 1_250, 3_000)
    protein = np.clip(rng.normal(118, 22, days), 45, 190)
    fat = np.clip(rng.normal(58, 15, days) + weekend * 7, 25, 125)
    carbs = np.clip((dietary_calories - protein * 4 - fat * 9) / 4, 90, 420)

    weight = np.empty(days)
    weight[0] = 73.8
    for index in range(1, days):
        energy_effect = (dietary_calories[index - 1] - total_calories[index - 1]) / 7_700
        water_noise = rng.normal(0, 0.075)
        reversion = (73.0 - weight[index - 1]) * 0.004
        weight[index] = weight[index - 1] + energy_effect + reversion + water_noise

    return pd.DataFrame(
        {
            "date": dates,
            "weight": weight.round(2),
            "bodyFatPercentage": (23.2 - (weight - 73.8) * 0.2 + rng.normal(0, 0.25, days)).round(2),
            "muscleMass": (55.1 + rng.normal(0, 0.18, days)).round(2),
            "steps": steps.round(),
            "activeCalories": np.clip(420 + (steps - 8_000) * 0.042 + rng.normal(0, 50, days), 100, 1_050).round(),
            "restingCalories": np.full(days, 1_650),
            "totalCalories": total_calories.round(),
            "dietaryCalories": dietary_calories.round(),
            "proteinG": protein.round(1),
            "fatG": fat.round(1),
            "carbohydrateG": carbs.round(1),
            "fiberG": np.clip(rng.normal(22, 6, days), 5, 45).round(1),
            "sugarG": np.clip(rng.normal(48, 17, days), 8, 120).round(1),
            "sodiumMg": np.clip(rng.normal(2_300, 600, days), 500, 4_800).round(),
        }
    )


def build_supervised_dataset(frame: pd.DataFrame, source: str) -> PreparedDataset:
    """当日の健康指標から翌日の体重を予測する行列を作る。

    目的変数は必ず翌日の体重にずらすため、当日以降の情報を特徴量に混ぜない。
    """

    data = _normalise_raw_data(frame)
    data["weight_7d_mean"] = data["weight"].rolling(window=7, min_periods=1).mean()
    data["weight_7d_change"] = data["weight"] - data["weight"].shift(6)
    data["calorie_balance"] = data["dietaryCalories"] - data["totalCalories"]
    weekday = data["date"].dt.dayofweek
    data["weekday_sin"] = np.sin(2 * np.pi * weekday / 7)
    data["weekday_cos"] = np.cos(2 * np.pi * weekday / 7)
    data["next_day_weight"] = data["weight"].shift(-1)

    learning_rows = data.dropna(subset=["weight", "next_day_weight"]).copy()
    # 最終日は翌日体重を持たないため、体重30日分から作れる教師あり行は29行となる。
    if len(learning_rows) < 29:
        raise ValueError("学習には、体重が入力された30日以上のデータが必要です。")

    return PreparedDataset(
        features=learning_rows.loc[:, FEATURE_COLUMNS],
        target=learning_rows["next_day_weight"],
        source=source,
    )


def latest_feature_row(frame: pd.DataFrame) -> pd.DataFrame:
    """最新日を翌日予測用の1行の特徴量に変換する。"""

    data = _normalise_raw_data(frame)
    if data["weight"].dropna().empty:
        raise ValueError("予測には最新の体重が必要です。")
    data["weight_7d_mean"] = data["weight"].rolling(window=7, min_periods=1).mean()
    data["weight_7d_change"] = data["weight"] - data["weight"].shift(6)
    data["calorie_balance"] = data["dietaryCalories"] - data["totalCalories"]
    weekday = data["date"].dt.dayofweek
    data["weekday_sin"] = np.sin(2 * np.pi * weekday / 7)
    data["weekday_cos"] = np.cos(2 * np.pi * weekday / 7)
    return data.loc[[data.index[-1]], FEATURE_COLUMNS]
