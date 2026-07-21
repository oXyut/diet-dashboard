from weight_ml.data import FEATURE_COLUMNS, build_supervised_dataset, make_synthetic_health_data


def test_synthetic_data_builds_a_supervised_dataset() -> None:
    raw = make_synthetic_health_data(days=50, seed=1)
    dataset = build_supervised_dataset(raw, source="test")

    assert list(dataset.features.columns) == FEATURE_COLUMNS
    assert len(dataset.features) == 49
    assert dataset.target.iloc[0] == raw["weight"].iloc[1]


def test_future_weight_is_not_used_as_a_feature() -> None:
    raw = make_synthetic_health_data(days=50, seed=2)
    dataset = build_supervised_dataset(raw, source="test")
    changed = raw.copy()
    changed.loc[1:, "weight"] = 999.0
    changed_dataset = build_supervised_dataset(changed, source="test")

    # 1日目の特徴量は、2日目（目的変数）の改ざんに影響されない。
    assert dataset.features.loc[0, "weight"] == changed_dataset.features.loc[0, "weight"]
    assert dataset.target.iloc[0] != changed_dataset.target.iloc[0]
    assert "next_day_weight" not in dataset.features.columns
