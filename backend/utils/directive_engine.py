from typing import Any, Dict, List


HIGH_RISK_FEATURES = {"safety", "heating_issue", "missing_items", "contamination", "damage"}
QA_FEATURES = {"packaging", "quality", "taste", "freshness", "delivery", "leakage", "seal"}

FEATURE_PLAYBOOK = {
    "packaging": [
        "Run packaging stress-test on current batch and verify seal integrity.",
        "Increase random QC sample size for packaging at warehouse dispatch."
    ],
    "delivery": [
        "Audit delivery SLA misses and cold-chain handling for impacted zones.",
        "Retrain last-mile partners for fragile-item handling."
    ],
    "taste": [
        "Validate lot-level quality with batch tasting and supplier check.",
        "Cross-check production date and storage compliance."
    ],
    "freshness": [
        "Check shelf-life controls and FIFO compliance in dark stores.",
        "Increase freshness audit frequency for this SKU."
    ],
    "quality": [
        "Perform root-cause analysis on recurring quality complaints.",
        "Create corrective-preventive action with QA owner and ETA."
    ],
    "missing_items": [
        "Audit pick-pack process and barcode scan compliance.",
        "Enable double-check step for high-error order lines."
    ],
    "safety": [
        "Escalate to safety committee and block suspicious lot pending QA clearance.",
        "Prepare customer advisory and incident response template."
    ],
    "heating_issue": [
        "Quarantine recent lots and run immediate defect reproduction test.",
        "Notify supplier and request failure-analysis report."
    ],
    "damage": [
        "Inspect transit packaging and warehouse stacking process.",
        "Enable photo-proof checks at pack and dispatch points."
    ],
}


def _priority_from_state(rar_score: float, churn_risk: float, visual_defect: bool) -> str:
    if visual_defect or rar_score >= 3500 or churn_risk >= 0.8:
        return "critical"
    if rar_score >= 2000 or churn_risk >= 0.65:
        return "warning"
    return "info"


def _feature_summary(feature_sentiments: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    negatives: List[str] = []
    dangerous: List[str] = []
    for feature, data in (feature_sentiments or {}).items():
        sentiment = (data or {}).get("sentiment")
        if sentiment in {"negative", "mixed"}:
            negatives.append(feature)
            if feature in HIGH_RISK_FEATURES:
                dangerous.append(feature)
    return {"negative_features": negatives, "dangerous_features": dangerous}


def build_actionable_directives(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    directives: List[Dict[str, Any]] = []
    feature_sentiments = state.get("feature_sentiments") or {}
    summary = _feature_summary(feature_sentiments)
    negative_features = summary["negative_features"]
    dangerous_features = summary["dangerous_features"]

    rar_score = float(state.get("rar_score") or 0.0)
    churn_risk = float(state.get("churn_risk") or 0.0)
    confidence = float(state.get("confidence_score") or 0.0)
    overall_sentiment = state.get("overall_sentiment") or "neutral"
    overall_score = float(state.get("overall_score") or 0.0)
    star_rating = int(state.get("star_rating") or 0)
    visual_defect = bool(state.get("visual_defect_detected"))
    product_id = state.get("product_id")

    priority = _priority_from_state(rar_score, churn_risk, visual_defect)
    top_negative = sorted(
        [
            (feature, abs((feature_sentiments.get(feature) or {}).get("score", 0.0)))
            for feature in negative_features
        ],
        key=lambda x: x[1],
        reverse=True
    )
    top_features = [f for f, _ in top_negative[:3]]

    dynamic_feature_steps: List[str] = []
    for feature in top_features:
        dynamic_feature_steps.extend(FEATURE_PLAYBOOK.get(feature, [f"Investigate repeated '{feature}' complaints with root-cause owner."])[:1])

    if visual_defect or (rar_score >= 2000 and any(f in QA_FEATURES for f in negative_features)):
        sig_features = "-".join(sorted(top_features[:2])) or "quality"
        directives.append({
            "directive_type": "qa_alert",
            "priority": priority,
            "title": "Immediate QA Investigation",
            "description": "Quality signals indicate probable product/packaging issue requiring rapid verification.",
            "action_text": "Run batch QC check, validate warehouse handling, and publish corrective action.",
            "owner": "QA Lead",
            "due_hours": 12 if priority == "critical" else 24,
            "recommended_actions": [
                *dynamic_feature_steps[:2],
                "Inspect latest inventory batch for physical defects.",
                "Publish corrective action note to Support team."
            ],
            "message": f"Quality issue detected. RAR: ₹{rar_score:.2f}",
            "reason": f"top_negative_features={top_features}, visual_defect={visual_defect}",
            "product_id": product_id,
            "issue_signature": f"qa_alert:{product_id}:{sig_features}:{int(bool(visual_defect))}",
            "dedup_hours": 48,
            "auto_draft": (
                "Dear QA Team, we detected recurring quality-related complaints with high financial impact. "
                "Please complete batch audit, identify root cause, and share corrective action ETA."
            ),
        })

    if churn_risk >= 0.65:
        directives.append({
            "directive_type": "churn_alert",
            "priority": "critical" if churn_risk >= 0.8 else "warning",
            "title": "Retention Intervention Required",
            "description": "Customer sentiment trajectory indicates elevated churn probability.",
            "action_text": "Contact customer with apology + compensation, then track sentiment recovery.",
            "owner": "CRM / Retention",
            "due_hours": 6 if churn_risk >= 0.8 else 12,
            "recommended_actions": [
                "Create retention ticket and assign owner immediately.",
                "Offer replacement/refund coupon and request follow-up feedback.",
                "Monitor next review sentiment for recovery signal.",
                *(dynamic_feature_steps[:1] if dynamic_feature_steps else [])
            ],
            "message": f"High churn probability detected: {churn_risk:.2f}",
            "reason": "customer_sentiment_decay",
            "product_id": product_id,
            "issue_signature": f"churn_alert:{product_id}:{'high' if churn_risk >= 0.8 else 'medium'}",
            "dedup_hours": 24,
            "auto_draft": (
                "Dear Customer, we are sorry for your experience. We are issuing immediate support and "
                "would value one chance to make this right."
            ),
        })

    if dangerous_features and confidence >= 0.85:
        directives.append({
            "directive_type": "pr_crisis",
            "priority": "critical",
            "title": "Potential PR / Safety Escalation",
            "description": "Critical risk features detected with high confidence; escalate for crisis response.",
            "action_text": "Escalate to leadership, prepare holding statement, and trigger incident protocol.",
            "owner": "Brand + PR",
            "due_hours": 4,
            "recommended_actions": [
                "Open incident bridge with QA, Ops, and PR.",
                "Prepare customer-facing holding statement.",
                "Track similar mentions across channels hourly."
            ],
            "message": f"Critical features flagged: {dangerous_features}",
            "reason": f"dangerous_feature_detection:{dangerous_features}",
            "product_id": product_id,
            "issue_signature": f"pr_crisis:{product_id}:{'-'.join(sorted(dangerous_features[:3]))}",
            "dedup_hours": 12,
            "auto_draft": (
                "URGENT: Safety-critical complaint pattern detected. Initiate crisis protocol and "
                "publish response plan within 4 hours."
            ),
        })

    if state.get("is_bot"):
        directives.append({
            "directive_type": "bot_activity",
            "priority": "warning",
            "title": "Bot-Like Review Activity",
            "description": "Review pattern appears synthetic and may distort sentiment metrics.",
            "action_text": "Exclude from KPI rollups until manual moderation confirms authenticity.",
            "owner": "Trust & Safety",
            "due_hours": 24,
            "recommended_actions": [
                "Send flagged review for moderation queue.",
                "Check reviewer pattern against recent submissions.",
                "Recompute dashboard metrics excluding suspicious reviews."
            ],
            "message": "Bot suspicion raised by NLP classifier.",
            "reason": "is_bot=true",
            "product_id": product_id,
            "issue_signature": f"bot_activity:{product_id}",
            "dedup_hours": 24,
            "auto_draft": "Moderation required: possible bot-generated review detected.",
        })

    if state.get("is_sarcasm"):
        directives.append({
            "directive_type": "sarcasm_watch",
            "priority": "warning" if overall_sentiment in {"negative", "mixed"} else "info",
            "title": "Sarcasm / Nuance Watch",
            "description": "Sarcasm detected; sentiment may require human interpretation before action.",
            "action_text": "Route this case to analyst review before automated escalation.",
            "owner": "CX Analyst",
            "due_hours": 24,
            "recommended_actions": [
                "Review context and confirm true sentiment intent.",
                "Correct label if sarcasm inverted sentiment.",
                "Feed edge-case into model improvement queue."
            ],
            "message": "Sarcasm signal detected.",
            "reason": "is_sarcasm=true",
            "product_id": product_id,
            "issue_signature": f"sarcasm_watch:{product_id}",
            "dedup_hours": 24,
            "auto_draft": "Sarcasm edge-case flagged. Analyst review requested.",
        })

    if overall_score <= -0.75 or (star_rating and star_rating <= 2 and overall_sentiment in {"negative", "mixed"}):
        directives.append({
            "directive_type": "cx_recovery",
            "priority": "critical" if overall_score <= -0.85 else "warning",
            "title": "Customer Recovery Action",
            "description": "Severe dissatisfaction signal detected in this review.",
            "action_text": "Initiate customer recovery flow with refund/replacement decision.",
            "owner": "Customer Support",
            "due_hours": 6,
            "recommended_actions": [
                "Open priority support ticket with owner.",
                "Offer apology + compensation path (refund/replacement/coupon).",
                "Capture post-resolution feedback for closure."
            ],
            "message": f"Severe sentiment: score={overall_score:.2f}, stars={star_rating}",
            "reason": "severe_negative_experience",
            "product_id": product_id,
            "issue_signature": f"cx_recovery:{product_id}:{'severe' if overall_score <= -0.85 else 'high'}",
            "dedup_hours": 12,
            "auto_draft": "High-priority recovery required for severely negative customer experience.",
        })

    if confidence < 0.4:
        directives.append({
            "directive_type": "low_confidence",
            "priority": "info",
            "title": "Low Confidence Classification",
            "description": "Model confidence is low; downstream business actions should be gated.",
            "action_text": "Require human verification before triggering policy/financial actions.",
            "owner": "Data Analyst",
            "due_hours": 24,
            "recommended_actions": [
                "Manually verify sentiment + feature extraction.",
                "Mark reviewed status and adjust action priority.",
                "Tag case for prompt/model tuning."
            ],
            "message": f"Low confidence: {confidence:.2f}",
            "reason": "confidence_below_threshold",
            "product_id": product_id,
            "issue_signature": f"low_confidence:{product_id}",
            "dedup_hours": 24,
            "auto_draft": "Low-confidence review flagged for manual validation.",
        })

    if rar_score >= 5000:
        directives.append({
            "directive_type": "rar_escalation",
            "priority": "critical",
            "title": "Revenue-at-Risk Escalation",
            "description": "RAR crossed high-severity threshold; coordinated response required.",
            "action_text": "Escalate to product + QA + support leads with 24h mitigation plan.",
            "owner": "War Room Lead",
            "due_hours": 4,
            "recommended_actions": [
                "Schedule war-room incident call with cross-functional owners.",
                "Prioritize fixes for top negative features immediately.",
                "Track RAR reduction daily until below threshold."
            ],
            "message": f"High RAR detected: ₹{rar_score:.2f}",
            "reason": "rar_threshold_breach",
            "product_id": product_id,
            "issue_signature": f"rar_escalation:{product_id}",
            "dedup_hours": 12,
            "auto_draft": "High RAR incident opened. Cross-functional mitigation plan required.",
        })

    if state.get("is_ambiguous") or state.get("is_sarcasm") or confidence < 0.45:
        directives.append({
            "directive_type": "manual_review",
            "priority": "warning" if overall_sentiment in {"negative", "mixed"} else "info",
            "title": "Manual Review Needed",
            "description": "Low-confidence or nuanced language detected (sarcasm/ambiguity).",
            "action_text": "Route to human reviewer before using this review for automated action.",
            "owner": "CX Analyst",
            "due_hours": 24,
            "recommended_actions": [
                "Verify sentiment label and feature mapping manually.",
                "Approve/reject downstream directives after review.",
                "Tag linguistic edge-case for model improvement.",
                *(dynamic_feature_steps[:1] if dynamic_feature_steps else [])
            ],
            "message": "Nuanced language detected; human validation suggested.",
            "reason": f"is_sarcasm={state.get('is_sarcasm')}, is_ambiguous={state.get('is_ambiguous')}, confidence={confidence:.2f}",
            "product_id": product_id,
            "issue_signature": f"manual_review:{product_id}:{int(bool(state.get('is_sarcasm')))}:{int(bool(state.get('is_ambiguous')))}",
            "dedup_hours": 24,
            "auto_draft": "Please review this edge-case review before operational escalation.",
        })

    if not directives and overall_sentiment in {"negative", "mixed"} and rar_score >= 500:
        directives.append({
            "directive_type": "monitor",
            "priority": "info",
            "title": "Monitor Emerging Dissatisfaction",
            "description": "Negative signal exists but below critical thresholds.",
            "action_text": "Track next 10 reviews and escalate if negative pattern persists.",
            "owner": "Product Ops",
            "due_hours": 48,
            "recommended_actions": [
                f"Watch repeat mention frequency for: {', '.join(top_features) if top_features else 'top negative features'}.",
                "Compare with previous 50-review window.",
                "Escalate to QA if complaints persist."
            ],
            "message": "Early warning signal detected.",
            "reason": f"rar_score={rar_score:.2f}",
            "product_id": product_id,
            "issue_signature": f"monitor:{product_id}:{'-'.join(sorted(top_features[:2])) or 'generic'}",
            "dedup_hours": 72,
            "auto_draft": "Monitoring initiated for early-stage dissatisfaction signal.",
        })

    return directives
