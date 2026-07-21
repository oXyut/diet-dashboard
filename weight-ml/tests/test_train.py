from weight_ml.train import train


def test_train_outputs_both_models_and_report(tmp_path) -> None:
    report = train(input_path=None, output_dir=tmp_path, synthetic_days=80)

    assert (tmp_path / "prediction_model.joblib").exists()
    assert (tmp_path / "interpretation_model.joblib").exists()
    assert (tmp_path / "training_report.json").exists()
    assert report["data_source"] == "synthetic_demo"
    assert "prediction_model" in report["temporal_holdout_metrics"]


def test_train_accepts_the_minimum_30_days_of_weight_data(tmp_path) -> None:
    report = train(input_path=None, output_dir=tmp_path, synthetic_days=30)

    assert report["training_rows"] == 29
