"""保存済みモデルで、CSVの最新日から翌日体重を推論するCLI。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib

from .data import FEATURE_COLUMNS, latest_feature_row, load_health_csv
from .models import local_interpretation


def main() -> None:
    parser = argparse.ArgumentParser(description="最新日のCSVから翌日体重を予測します。")
    parser.add_argument("--input", type=Path, required=True, help="健康データCSV")
    parser.add_argument("--model-dir", type=Path, default=Path("artifacts"), help="学習済みモデルの場所")
    args = parser.parse_args()

    raw_data = load_health_csv(args.input)
    features = latest_feature_row(raw_data)
    prediction_model = joblib.load(args.model_dir / "prediction_model.joblib")
    interpretation_model = joblib.load(args.model_dir / "interpretation_model.joblib")
    result = {
        "prediction_model_next_day_kg": round(float(prediction_model.predict(features)[0]), 3),
        "interpretation_model": local_interpretation(interpretation_model, features, FEATURE_COLUMNS),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
