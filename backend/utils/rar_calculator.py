from utils.domain_config import RAR_WEIGHTS

CUSTOMER_LIFETIME_VALUE = 15000

def calculate_rar(feature_sentiments: dict, review_count: int = 1, clv: float = CUSTOMER_LIFETIME_VALUE) -> float:
    rar = 0.0
    for feature, data in feature_sentiments.items():
        if data.get("sentiment") in ["negative", "mixed"]:
            weight = RAR_WEIGHTS.get(feature, RAR_WEIGHTS["default"])
            severity = abs(data.get("score", 0.5))
            rar += weight * severity * clv * 0.1 * review_count
    return round(rar, 2)

def calculate_churn_risk(sentiment_history: list) -> float:
    if len(sentiment_history) < 2:
        return 0.0
    scores = [s["sentiment_score"] for s in sorted(sentiment_history, key=lambda x: x.get("recorded_at", ""))]
    if len(scores) >= 3:
        decay = scores[-1] - scores[0]
        if decay < -0.5:
            return min(0.95, abs(decay))
        elif decay < -0.3:
            return 0.6
        elif decay < -0.1:
            return 0.35
    return max(0.0, -scores[-1] * 0.5)

def calculate_svi(current_negative_pct: float, previous_negative_pct: float) -> float:
    return round(current_negative_pct - previous_negative_pct, 4)