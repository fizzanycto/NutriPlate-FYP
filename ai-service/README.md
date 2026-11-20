# NutriPlate - AI Service (Phase 1)
Run:
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000
Docs (auto): http://localhost:8000/docs
Tests:  python -m pytest -q
Endpoints: GET /health, GET /menu, POST /extract-profile, POST /recommend, POST /prescription-note
