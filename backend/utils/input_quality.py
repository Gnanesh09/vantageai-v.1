import re
from typing import Dict


def assess_text_quality(text: str) -> Dict[str, object]:
    raw = (text or "").strip()
    if not raw:
        return {"is_valid": False, "reason": "empty_text", "quality_score": 0.0}

    if len(raw) < 4:
        return {"is_valid": False, "reason": "too_short", "quality_score": 0.05}

    alpha_chars = re.findall(r"[A-Za-z]", raw)
    digit_chars = re.findall(r"[0-9]", raw)
    alpha_count = len(alpha_chars)
    digit_count = len(digit_chars)
    alnum_count = alpha_count + digit_count

    if alpha_count < 3:
        return {"is_valid": False, "reason": "insufficient_alpha", "quality_score": 0.1}

    compact = re.sub(r"\s+", " ", raw)
    tokens = [t for t in re.split(r"\s+", compact) if t]
    long_tokens = [t for t in tokens if len(t) >= 5]

    # Catch heavy symbol noise like "%%%^^^@@@".
    non_alnum = len(re.findall(r"[^A-Za-z0-9\s.,!?'-]", raw))
    symbol_ratio = non_alnum / max(len(raw), 1)
    if symbol_ratio > 0.35:
        return {"is_valid": False, "reason": "symbol_noise", "quality_score": 0.15}

    # Repetition artifacts like "gooooodddddd" or "aaaaaaa".
    if re.search(r"(.)\1{5,}", raw):
        return {"is_valid": False, "reason": "repeated_characters", "quality_score": 0.2}

    # Probable gibberish: long latin token with almost no vowels.
    def is_probably_gibberish(tok: str) -> bool:
        if len(tok) < 6 or not re.fullmatch(r"[A-Za-z]+", tok):
            return False
        vowels = len(re.findall(r"[aeiouAEIOU]", tok))
        vowel_ratio = vowels / len(tok)
        consonant_runs = re.findall(r"[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}", tok)
        return vowel_ratio < 0.15 or len(consonant_runs) > 0

    gibberish_hits = sum(1 for t in long_tokens if is_probably_gibberish(t))
    if long_tokens and gibberish_hits / len(long_tokens) >= 0.5:
        return {"is_valid": False, "reason": "probable_gibberish", "quality_score": 0.2}

    # Basic quality score for gating/observability.
    token_score = min(len(tokens) / 12, 1.0)
    alnum_ratio = min(alnum_count / max(len(raw), 1), 1.0)
    quality = round((0.6 * token_score) + (0.4 * alnum_ratio), 3)

    return {"is_valid": True, "reason": None, "quality_score": quality}
