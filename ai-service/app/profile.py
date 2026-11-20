import re
from .rules import CONDITION_SYNONYMS, ALLERGEN_SYNONYMS


def _hit(text, words):
    for w in words:
        if re.search(r"(?<!\w)" + re.escape(w) + r"(?!\w)", text):
            return True
    return False


def extract_profile(text: str) -> dict:
    """Very small rule-based extractor so the system works offline.
    Phase 4 replaces this with an LLM call (same output format)."""
    t = text.lower()
    conditions = [c for c, ws in CONDITION_SYNONYMS.items() if _hit(t, ws)]
    # allergies only if the user says allergy-ish word near the allergen
    allergies = []
    if re.search(r"allerg|alerji|الرجی|cannot eat|can't eat|nahi kha", t):
        allergies = [a for a, ws in ALLERGEN_SYNONYMS.items() if _hit(t, ws)]
    return {"conditions": conditions, "allergies": allergies}
