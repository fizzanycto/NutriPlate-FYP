from app.recommender import recommend, load_menu, check_item
from app.profile import extract_profile

ITEMS = {i["id"]: i for i in load_menu()["items"]}


def ids(res):
    return {r["id"] for r in res["recommendations"]}


def test_diabetic_never_gets_sweets():
    res = recommend({"conditions": ["diabetes"], "allergies": []}, top_k=50)
    assert not ids(res) & {"m5", "m25", "m9", "m15"}


def test_hypertension_blocks_salty_food():
    res = recommend({"conditions": ["hypertension"], "allergies": []}, top_k=50)
    assert not ids(res) & {"m1", "m4", "m21", "m22", "m23"}


def test_kidney_blocks_high_potassium():
    res = recommend({"conditions": ["kidney"], "allergies": []}, top_k=50)
    assert "m9" not in ids(res) and "m4" not in ids(res)


def test_allergy_filter():
    res = recommend({"conditions": [], "allergies": ["milk", "gluten"]}, top_k=50)
    for r in res["recommendations"]:
        assert not set(r["allergens"]) & {"milk", "gluten"}


def test_query_ranks_relevant_first():
    res = recommend({"conditions": ["diabetes"], "allergies": []}, query="light soup", top_k=3)
    assert any("soup" in r["name"].lower() or "soup" in r["tags"] for r in res["recommendations"][:2])


def test_95_percent_violation_exclusion():
    """Proposal objective: exclude >=95% of restriction-violating meals."""
    total_bad = caught = 0
    for cond in ["diabetes", "hypertension", "kidney", "heart", "obesity"]:
        res = recommend({"conditions": [cond], "allergies": []}, top_k=100)
        shown = ids(res)
        for it in ITEMS.values():
            ok, *_ = check_item(it, [cond], [])
            if not ok:
                total_bad += 1
                caught += it["id"] not in shown
    assert total_bad and caught / total_bad >= 0.95


def test_extract_english_urdu():
    assert "diabetes" in extract_profile("mujhe sugar hai aur BP high hai")["conditions"]
    p = extract_profile("I have kidney problem, allergy to peanuts")
    assert p["conditions"] == ["kidney"] and p["allergies"] == ["peanuts"]
