from weight_ml.registry import should_promote


def test_first_candidate_is_promoted() -> None:
    assert should_promote(0.12, None)


def test_only_strict_mae_improvement_is_promoted() -> None:
    assert should_promote(0.11, 0.12)
    assert not should_promote(0.12, 0.12)
    assert not should_promote(0.13, 0.12)
