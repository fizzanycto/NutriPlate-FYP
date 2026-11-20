from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .recommender import recommend, load_menu, prescription_note, check_items
from .profile import extract_profile

app = FastAPI(title="NutriPlate AI Service", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Profile(BaseModel):
    conditions: List[str] = []
    allergies: List[str] = []


class RecommendReq(BaseModel):
    profile: Profile
    query: Optional[str] = None
    provider_ids: Optional[List[str]] = None
    max_price: Optional[float] = None
    top_k: int = 10
    items: Optional[List[dict]] = None


class ExtractReq(BaseModel):
    text: str


class NoteReq(BaseModel):
    profile: Profile
    order_items: List[dict] = []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/menu")
def menu():
    return load_menu()


@app.post("/extract-profile")
def extract(req: ExtractReq):
    return extract_profile(req.text)


@app.post("/recommend")
def rec(req: RecommendReq):
    return recommend(req.profile.model_dump(), req.query, req.provider_ids, req.top_k, req.max_price, req.items)


@app.post("/prescription-note")
def note(req: NoteReq):
    return {"note": prescription_note(req.profile.model_dump(), req.order_items)}


class CheckReq(BaseModel):
    profile: Profile
    items: List[dict]


@app.post("/check-items")
def check(req: CheckReq):
    return {"problems": check_items(req.profile.model_dump(), req.items)}
