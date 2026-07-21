"""MLflow Champion昇格の判断規則。"""


def should_promote(candidate_mae_kg: float, champion_mae_kg: float | None) -> bool:
    """初回は昇格し、以降は同一評価条件でMAEが厳密に改善した場合だけ昇格する。"""

    return champion_mae_kg is None or candidate_mae_kg < champion_mae_kg
