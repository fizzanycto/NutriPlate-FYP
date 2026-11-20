import json
from pathlib import Path
from typing import List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .rules import CONDITION_RULES

DATA = Path(__file__).parent / "data" / "menu.json"


def load_menu():
    return json.loads(DATA.read_text(encoding="utf-8"))


def check_item(item: dict, conditions: List[str], allergies: List[str]):
    """Returns (is_safe, reasons_blocked, penalty, bonus)."""
    blocked, penalty, bonus = [], 0.0, 0.0
    for a in allergies:
        if a in item["allergens"]:
            blocked.append(f"contains {a} (allergy)")
    for c in conditions:
        rule = CONDITION_RULES.get(c)
        if not rule:
            continue
        for nutrient, limit in rule["hard"].items():
            if item[nutrient] > limit:
                blocked.append(f"{nutrient} {item[nutrient]} > {limit} ({rule['label']})")
        for nutrient, limit in rule["soft"].items():
            if item[nutrient] > limit:
                penalty += min((item[nutrient] - limit) / limit, 1.0) * 15
        for nutrient, target in rule["bonus"].items():
            if item[nutrient] >= target:
                bonus += 8
    return (len(blocked) == 0), blocked, penalty, bonus


def _text(item):
    return f"{item['name']} {item['description']} {' '.join(item['tags'])}"


def recommend(profile: dict, query: Optional[str] = None, provider_ids=None,
              top_k: int = 10, max_price: Optional[float] = None, items_override=None):
    menu = {"items": items_override} if items_override is not None else load_menu()
    conditions = profile.get("conditions", [])
    allergies = profile.get("allergies", [])

    items = [i for i in menu["items"]
             if (not provider_ids or i["provider_id"] in provider_ids)
             and (max_price is None or i["price"] <= max_price)]

    # text relevance (TF-IDF) between query and meal text, 0..1
    sims = [0.0] * len(items)
    if query and query.strip() and items:
        vec = TfidfVectorizer(stop_words="english")
        mat = vec.fit_transform([_text(i) for i in items] + [query])
        sims = cosine_similarity(mat[-1], mat[:-1])[0].tolist()

    safe, excluded = [], []
    for item, sim in zip(items, sims):
        ok, reasons, penalty, bonus = check_item(item, conditions, allergies)
        if not ok:
            excluded.append({"id": item["id"], "name": item["name"], "reasons": reasons})
            continue
        health = max(0.0, min(100.0, 85 - penalty + bonus))
        score = health * 0.7 + sim * 100 * 0.3 if query else health
        safe.append({**item, "health_score": round(health, 1),
                     "match_score": round(sim, 3), "final_score": round(score, 1)})
    safe.sort(key=lambda x: x["final_score"], reverse=True)
    return {"recommendations": safe[:top_k], "excluded_count": len(excluded), "excluded": excluded,
            "total_considered": len(items)}


def prescription_note(profile: dict, order_items: List[dict]) -> str:
    """Rule-based dietary note for the restaurant. Phase 4 upgrades this to
    an LLM-written note using the same facts."""
    lines = []
    cons = [CONDITION_RULES[c] for c in profile.get("conditions", []) if c in CONDITION_RULES]
    if cons:
        lines.append("Patient conditions: " + ", ".join(c["label"] for c in cons) + ".")
        lines.append("Please prepare with: " + "; ".join(c["advice"] for c in cons) + ".")
    if profile.get("allergies"):
        lines.append("ALLERGIES - strictly avoid: " + ", ".join(profile["allergies"]) + ".")
    if order_items:
        lines.append("Ordered: " + ", ".join(i["name"] for i in order_items) + ".")
    return " ".join(lines) or "No special dietary restrictions."


def check_items(profile: dict, items: List[dict]):
    """Safety check for a cart: returns the items that break the patient's diet."""
    problems = []
    for it in items:
        ok, reasons, _, _ = check_item(it, profile.get("conditions", []), profile.get("allergies", []))
        if not ok:
            problems.append({"id": it["id"], "name": it["name"], "reasons": reasons})
    return problems
