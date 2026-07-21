"""予測精度用・解釈用の2モデルと評価・解釈処理。"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge, RidgeCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def make_prediction_model() -> Pipeline:
    """時系列CVで正則化を選ぶ、精度優先の翌日体重予測モデル。

    小規模な個人データでは複雑な木モデルが直近の体重水準を外挿できず、
    かえって不安定になりやすい。そのため、時系列CV付きのRidge回帰を採用する。
    """

    return Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            (
                "scaler",
                StandardScaler(),
            ),
            ("model", RidgeCV(alphas=[0.01, 0.1, 1.0, 5.0, 10.0, 20.0], cv=TimeSeriesSplit(n_splits=5))),
        ]
    )


def make_interpretation_model() -> Pipeline:
    """係数を説明できる線形モデル。予測モデルとは目的を分ける。"""

    return Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("model", Ridge(alpha=5.0)),
        ]
    )


def evaluate(model: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> dict[str, float]:
    predictions = model.predict(x_test)
    return {
        "mae_kg": round(float(mean_absolute_error(y_test, predictions)), 4),
        "rmse_kg": round(float(mean_squared_error(y_test, predictions) ** 0.5), 4),
        "r2": round(float(r2_score(y_test, predictions)), 4),
    }


def global_interpretation(model: Pipeline, feature_names: list[str]) -> list[dict[str, Any]]:
    """標準化係数を用い、各指標の方向と相対的な影響の強さを返す。"""

    coefficients = model.named_steps["model"].coef_
    explanation = []
    for feature, coefficient in zip(feature_names, coefficients, strict=True):
        explanation.append(
            {
                "feature": feature,
                "standardized_coefficient": round(float(coefficient), 5),
                "direction": "増加方向" if coefficient > 0 else "減少方向",
                "importance": round(float(abs(coefficient)), 5),
            }
        )
    return sorted(explanation, key=lambda item: item["importance"], reverse=True)


def local_interpretation(
    model: Pipeline, feature_row: pd.DataFrame, feature_names: list[str]
) -> dict[str, Any]:
    """最新1日の解釈モデル予測と、その特徴量別寄与を返す。"""

    imputed = model.named_steps["imputer"].transform(feature_row)
    standardised = model.named_steps["scaler"].transform(imputed)[0]
    ridge = model.named_steps["model"]
    contributions = standardised * ridge.coef_
    rows = [
        {
            "feature": name,
            "contribution_kg": round(float(value), 5),
        }
        for name, value in zip(feature_names, contributions, strict=True)
    ]
    return {
        "prediction_kg": round(float(model.predict(feature_row)[0]), 3),
        "baseline_kg": round(float(ridge.intercept_), 3),
        "top_contributions": sorted(rows, key=lambda item: abs(item["contribution_kg"]), reverse=True)[:8],
    }


def fit_models(features: pd.DataFrame, target: pd.Series) -> tuple[Pipeline, Pipeline, dict[str, dict[str, float]]]:
    """時系列を保った80/20分割で評価後、全データで最終学習する。"""

    split_at = int(len(features) * 0.8)
    if len(features) - split_at < 6:
        raise ValueError("時系列テスト用に6日以上残るデータが必要です。")
    x_train, x_test = features.iloc[:split_at], features.iloc[split_at:]
    y_train, y_test = target.iloc[:split_at], target.iloc[split_at:]

    prediction_model = make_prediction_model().fit(x_train, y_train)
    interpretation_model = make_interpretation_model().fit(x_train, y_train)
    metrics = {
        "prediction_model": evaluate(prediction_model, x_test, y_test),
        "interpretation_model": evaluate(interpretation_model, x_test, y_test),
    }
    return (
        make_prediction_model().fit(features, target),
        make_interpretation_model().fit(features, target),
        metrics,
    )
