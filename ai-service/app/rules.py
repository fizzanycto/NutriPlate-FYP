"""Medical-diet rules. Each condition has HARD limits (meal is excluded) and
SOFT targets (meal is penalised in the score). Values are per serving.
These are demo thresholds based on common dietary guidelines - a real
deployment must be reviewed by a dietitian."""

CONDITION_RULES = {
    "diabetes": {
        "label": "Diabetes",
        "hard": {"sugar_g": 15, "carbs_g": 65},
        "soft": {"carbs_g": 45, "sugar_g": 8},
        "bonus": {"fiber_g": 6},
        "advice": "keep sugar and refined carbs low, prefer high-fibre food",
    },
    "hypertension": {
        "label": "High blood pressure",
        "hard": {"sodium_mg": 600},
        "soft": {"sodium_mg": 350},
        "bonus": {},
        "advice": "low salt (sodium) and avoid pickled or very salty food",
    },
    "kidney": {
        "label": "Kidney disease",
        "hard": {"potassium_mg": 600, "phosphorus_mg": 300, "sodium_mg": 600},
        "soft": {"potassium_mg": 400, "phosphorus_mg": 200, "protein_g": 20},
        "bonus": {},
        "advice": "limit potassium, phosphorus, salt and excess protein",
    },
    "heart": {
        "label": "Heart disease",
        "hard": {"sat_fat_g": 8, "sodium_mg": 700},
        "soft": {"sat_fat_g": 4, "sodium_mg": 400},
        "bonus": {"fiber_g": 6},
        "advice": "low saturated fat and low salt, avoid fried and oily food",
    },
    "obesity": {
        "label": "Weight management",
        "hard": {"calories": 600},
        "soft": {"calories": 400, "sat_fat_g": 4},
        "bonus": {"protein_g": 25, "fiber_g": 6},
        "advice": "lower calories, higher protein and fibre",
    },
}

# words (English / Roman Urdu / Urdu) -> canonical condition. Used by the
# profile extractor now; the LLM extractor replaces/extends it in Phase 4.
CONDITION_SYNONYMS = {
    "diabetes": ["diabetes", "diabetic", "sugar", "shugar", "sugar ki bimari", "ذیابطیس", "شوگر"],
    "hypertension": ["hypertension", "blood pressure", "high bp", "bp", "bp high", "بلڈ پریشر"],
    "kidney": ["kidney", "renal", "ckd", "gurda", "gurde", "گردے"],
    "heart": ["heart", "cardiac", "cholesterol", "dil", "دل"],
    "obesity": ["obesity", "overweight", "weight loss", "motapa", "موٹاپا"],
}

ALLERGEN_SYNONYMS = {
    "peanuts": ["peanut", "peanuts", "moongphali", "مونگ پھلی"],
    "milk": ["milk", "dairy", "lactose", "doodh", "دودھ"],
    "eggs": ["egg", "eggs", "anda", "انڈا"],
    "gluten": ["gluten", "wheat", "gandum", "گندم"],
    "fish": ["fish", "machli", "مچھلی"],
}
