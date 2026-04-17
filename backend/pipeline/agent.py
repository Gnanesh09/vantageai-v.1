import json
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from services.azure_nlp import analyse_review_with_gpt
from services.azure_vision import analyse_image
from utils.domain_config import build_system_prompt
from utils.deduplication import is_duplicate
from utils.rar_calculator import calculate_rar, calculate_churn_risk, calculate_svi
from config import get_supabase

class ReviewState(TypedDict):
    review_id: str
    brand_id: str
    product_id: Optional[str]
    raw_text: str
    image_url: Optional[str]
    star_rating: Optional[int]
    reviewer_id: Optional[str]
    source: str
    domain: str
    custom_attributes: list
    currency: str
    is_duplicate: bool
    is_bot: bool
    normalized_text: Optional[str]
    detected_language: Optional[str]
    is_sarcasm: bool
    is_ambiguous: bool
    overall_sentiment: str
    overall_score: float
    confidence_score: float
    feature_sentiments: dict
    visual_defect_detected: bool
    visual_defect_description: Optional[str]
    rar_score: float
    churn_risk: float
    svi_score: float
    error: Optional[str]

def node_deduplicate(state: ReviewState) -> ReviewState:
    try:
        dup = is_duplicate(state["review_id"], state["raw_text"])
        state["is_duplicate"] = dup
        if dup:
            state["error"] = "duplicate"
    except Exception:
        state["is_duplicate"] = False
    return state

def node_nlp_analysis(state: ReviewState) -> ReviewState:
    if state.get("is_duplicate"):
        return state
    try:
        prompt = build_system_prompt(state["domain"], state.get("custom_attributes", []))
        result = analyse_review_with_gpt(state["raw_text"], prompt)
        state["normalized_text"] = result.get("normalized_text", state["raw_text"])
        state["detected_language"] = result.get("detected_language", "english")
        state["is_sarcasm"] = result.get("is_sarcasm", False)
        state["is_ambiguous"] = result.get("is_ambiguous", False)
        state["is_bot"] = result.get("is_bot", False)
        state["overall_sentiment"] = result.get("overall_sentiment", "neutral")
        state["overall_score"] = result.get("overall_score", 0.0)
        state["confidence_score"] = result.get("confidence_score", 0.0)
        state["feature_sentiments"] = result.get("feature_sentiments", {})
    except Exception as e:
        state["error"] = f"NLP error: {str(e)}"
        state["overall_sentiment"] = "neutral"
        state["overall_score"] = 0.0
        state["confidence_score"] = 0.0
        state["feature_sentiments"] = {}
        state["is_sarcasm"] = False
        state["is_ambiguous"] = False
        state["is_bot"] = False
    return state

def node_vision_analysis(state: ReviewState) -> ReviewState:
    if state.get("is_duplicate") or not state.get("image_url"):
        state["visual_defect_detected"] = False
        state["visual_defect_description"] = None
        return state
    try:
        result = analyse_image(state["image_url"])
        state["visual_defect_detected"] = result.get("visual_defect_detected", False)
        state["visual_defect_description"] = result.get("visual_defect_description")
    except Exception:
        state["visual_defect_detected"] = False
        state["visual_defect_description"] = None
    return state

def node_financial_scoring(state: ReviewState) -> ReviewState:
    if state.get("is_duplicate"):
        state["rar_score"] = 0.0
        state["churn_risk"] = 0.0
        state["svi_score"] = 0.0
        return state
    try:
        rar = calculate_rar(state.get("feature_sentiments", {}))
        if state.get("visual_defect_detected"):
            rar *= 1.3
        churn = 0.0
        svi = 0.0
        if state.get("reviewer_id"):
            db = get_supabase()
            history = db.table("customer_sentiment_history")\
                .select("*").eq("brand_id", state["brand_id"])\
                .eq("reviewer_id", state["reviewer_id"])\
                .order("recorded_at").execute()
            history_data = history.data or []
            history_data.append({"sentiment_score": state["overall_score"], "recorded_at": "now"})
            churn = calculate_churn_risk(history_data)
        if state.get("product_id"):
            db = get_supabase()
            recent = db.table("insights").select("overall_score")\
                .eq("product_id", state["product_id"])\
                .order("processed_at", desc=True).limit(100).execute()
            scores = [r["overall_score"] for r in (recent.data or [])]
            if len(scores) >= 100:
                current_neg = len([s for s in scores[:50] if s < 0]) / 50
                prev_neg = len([s for s in scores[50:] if s < 0]) / 50
                svi = calculate_svi(current_neg, prev_neg)
        state["rar_score"] = round(rar, 2)
        state["churn_risk"] = round(churn, 4)
        state["svi_score"] = round(svi, 4)
    except Exception:
        state["rar_score"] = 0.0
        state["churn_risk"] = 0.0
        state["svi_score"] = 0.0
    return state

def node_save_to_db(state: ReviewState) -> ReviewState:
    if state.get("is_duplicate"):
        return state
    try:
        db = get_supabase()
        db.table("reviews").update({
            "is_bot": state.get("is_bot", False),
            "is_duplicate": False
        }).eq("id", state["review_id"]).execute()
        db.table("insights").insert({
            "review_id": state["review_id"],
            "brand_id": state["brand_id"],
            "product_id": state.get("product_id"),
            "normalized_text": state.get("normalized_text"),
            "detected_language": state.get("detected_language"),
            "is_sarcasm": state.get("is_sarcasm", False),
            "is_ambiguous": state.get("is_ambiguous", False),
            "overall_sentiment": state.get("overall_sentiment", "neutral"),
            "overall_score": state.get("overall_score", 0.0),
            "confidence_score": state.get("confidence_score", 0.0),
            "feature_sentiments": state.get("feature_sentiments", {}),
            "rar_score": state.get("rar_score", 0.0),
            "churn_risk": state.get("churn_risk", 0.0),
            "svi_score": state.get("svi_score", 0.0),
            "visual_defect_detected": state.get("visual_defect_detected", False),
            "visual_defect_description": state.get("visual_defect_description"),
        }).execute()
        if state.get("reviewer_id"):
            db.table("customer_sentiment_history").insert({
                "brand_id": state["brand_id"],
                "reviewer_id": state["reviewer_id"],
                "sentiment_score": state.get("overall_score", 0.0),
                "review_id": state["review_id"]
            }).execute()
    except Exception as e:
        state["error"] = f"DB save error: {str(e)}"
    return state

def node_auto_directives(state: ReviewState) -> ReviewState:
    if state.get("is_duplicate") or state.get("is_bot"):
        return state
    try:
        db = get_supabase()
        directives = []
        if state.get("rar_score", 0) > 2000 or state.get("visual_defect_detected"):
            directives.append({
                "brand_id": state["brand_id"],
                "review_id": state["review_id"],
                "directive_type": "qa_alert",
                "payload": {
                    "message": f"Quality issue detected. RAR: ₹{state.get('rar_score')}",
                    "features": list(state.get("feature_sentiments", {}).keys()),
                    "visual_defect": state.get("visual_defect_detected"),
                    "auto_draft": f"Dear QA Team, a critical quality complaint has been flagged. RAR Score: ₹{state.get('rar_score')}. Please investigate immediately."
                },
                "status": "pending"
            })
        if state.get("churn_risk", 0) > 0.65:
            directives.append({
                "brand_id": state["brand_id"],
                "review_id": state["review_id"],
                "directive_type": "churn_alert",
                "payload": {
                    "reviewer_id": state.get("reviewer_id"),
                    "churn_probability": state.get("churn_risk"),
                    "auto_draft": "Dear valued customer, we noticed your recent experience was not great. We would love to make it right."
                },
                "status": "pending"
            })
        dangerous_features = ["safety", "heating_issue", "missing_items"]
        flagged = [f for f in dangerous_features if f in state.get("feature_sentiments", {})]
        if flagged and state.get("confidence_score", 0) > 0.85:
            directives.append({
                "brand_id": state["brand_id"],
                "review_id": state["review_id"],
                "directive_type": "pr_crisis",
                "payload": {
                    "features_flagged": flagged,
                    "message": f"URGENT: Safety/critical issue detected. Features: {flagged}"
                },
                "status": "pending"
            })
        if directives:
            db.table("directives").insert(directives).execute()
    except Exception as e:
        state["error"] = f"Directive error: {str(e)}"
    return state

def node_trend_detection(state: ReviewState) -> ReviewState:
    if state.get("is_duplicate") or not state.get("product_id"):
        return state
    try:
        db = get_supabase()
        recent = db.table("insights").select("feature_sentiments")\
            .eq("product_id", state["product_id"])\
            .order("processed_at", desc=True).limit(100).execute()
        all_insights = recent.data or []
        if len(all_insights) < 10:
            return state
        current_batch = all_insights[:50]
        prev_batch = all_insights[50:] if len(all_insights) >= 50 else []

        def feature_neg_pct(batch, feature):
            mentions = [i["feature_sentiments"].get(feature) for i in batch if i.get("feature_sentiments", {}).get(feature)]
            neg = [m for m in mentions if m and m.get("sentiment") == "negative"]
            return len(neg) / max(len(batch), 1)

        current_features = {}
        for insight in current_batch:
            for feat in (insight.get("feature_sentiments") or {}).keys():
                current_features[feat] = current_features.get(feat, 0) + 1

        for feature, count in current_features.items():
            curr_pct = feature_neg_pct(current_batch, feature)
            prev_pct = feature_neg_pct(prev_batch, feature) if prev_batch else 0
            is_systemic = count >= 5
            trend_type = None
            if curr_pct > 0.3 and curr_pct > prev_pct + 0.15:
                trend_type = "emerging_complaint"
            elif curr_pct < 0.1 and prev_pct > 0.25:
                trend_type = "anomaly"
            elif curr_pct > 0.5 and is_systemic:
                trend_type = "systemic_issue"
            if trend_type:
                db.table("trends").insert({
                    "brand_id": state["brand_id"],
                    "product_id": state["product_id"],
                    "feature": feature,
                    "trend_type": trend_type,
                    "current_percentage": round(curr_pct * 100, 1),
                    "previous_percentage": round(prev_pct * 100, 1),
                    "review_count": count,
                    "window_size": len(current_batch),
                    "is_systemic": is_systemic
                }).execute()
    except Exception:
        pass
    return state

def build_pipeline():
    graph = StateGraph(ReviewState)
    graph.add_node("deduplicate", node_deduplicate)
    graph.add_node("nlp_analysis", node_nlp_analysis)
    graph.add_node("vision_analysis", node_vision_analysis)
    graph.add_node("financial_scoring", node_financial_scoring)
    graph.add_node("save_to_db", node_save_to_db)
    graph.add_node("auto_directives", node_auto_directives)
    graph.add_node("trend_detection", node_trend_detection)
    graph.set_entry_point("deduplicate")
    graph.add_edge("deduplicate", "nlp_analysis")
    graph.add_edge("nlp_analysis", "vision_analysis")
    graph.add_edge("vision_analysis", "financial_scoring")
    graph.add_edge("financial_scoring", "save_to_db")
    graph.add_edge("save_to_db", "auto_directives")
    graph.add_edge("auto_directives", "trend_detection")
    graph.add_edge("trend_detection", END)
    return graph.compile()

pipeline = build_pipeline()

async def run_pipeline(review_data: dict) -> dict:
    result = pipeline.invoke(review_data)
    return result