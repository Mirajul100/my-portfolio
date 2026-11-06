import json
import time
from collections import defaultdict
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE = Path(__file__).parent
MESSAGES = BASE / "messages.jsonl"

app = FastAPI(title="Mirajul Portfolio")

# ---------- Data: edit these ----------
PROJECTS = [
    {
        "title": "Lumen Ai",
        "flow": ["URL", "Transcribe", "Analyze", "Summarize", "Ask Questions" , "Ai Chat"],
        "description": "AI-powered YouTube video and document analysis. Paste a link or upload a document, get structured insight without watching the whole video. Helpful for research, learning, and studying.",
        "stack": ["Python", "FastAPI", "Hugging Face", "Gemini" , "HTML" , "CSS" , "JavaScript"],
        "metric_label": "status",
        "metric": "in development",
        "link": "https://github.com/Mirajul100/Ai-video-assistant",
        "image": "img/lumen_ai.png",
    },
    {
        "title": "Movie BD",
        "flow": ["Search", "Recommend", "Watchlist" , "Rate" , "Review" , "Trending" , "Watch Trailers"],
        "description": "Movie BD is a movie recommendation system that uses machine learning and natural language processing to recommend movies based on user preferences. It fetches data from TMDB and Watchmode APIs to provide accurate recommendations.",
        "stack": ["Python", "FastAPI", "TMDB API" , "Watchmode API" , "ML" , "NLP" , "HTML" , "CSS" , "JavaScript"],
        "metric_label": "result",
        "metric": "completed",
        "link": "https://github.com/Mirajul100/Movie-recommendation-system",
        "image": "img/movie_bd.png",
    },
    {
        "title": "Shopnex",
        "flow": ["Browse Products", "Add to Cart", "Checkout", "Payment" , "SSLCommerz", "Order Confirmation"],
        "description": "A modern e-commerce website built with Python and Django , HTML , CSS , JavaScript. Features include product browsing, shopping cart, and secure checkout. ",
        "stack": ["Python", "Django", "HTML", "CSS", "JavaScript" , "Jinja2" , "Django database" , "sqlite3"],
        "metric_label": "result",
        "metric": "completed",
        "link": "https://github.com/Mirajul100/ecommerce-website",
        "image": "img/shopnex.png",
    },
    {
        "title": "Mango leaf disease detection",
        "flow": ["Upload Image", "Detect Disease", "Get Results"],
        "description": "A deep learning custom CNN model for detecting diseases in mango leaves.",
        "stack": ["Python", "TensorFlow", "Custom CNN", "FirstApi" , "HTML" , "CSS" , "JavaScript" , "keras" , "NumPy" , "Pandas"],
        "metric_label": "result",
        "metric": "in development",
        "link": "https://colab.research.google.com/drive/14kKNCUsT2o3nAMd0iuBhw2Fz0EEJjLZd",
        "image": "img/mango_leaf_disease_detection.png",
    },
]


# ---------- Schemas ----------
class Contact(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=120)
    message: str = Field(min_length=10, max_length=2000)
    website: str = ""  # honeypot: real users leave this empty


# ---------- API ----------
_hits: dict[str, list[float]] = defaultdict(list)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/projects")
def projects():
    return PROJECTS


@app.post("/api/contact", status_code=201)
def contact(body: Contact, request: Request):
    if body.website:  # bot filled the honeypot; pretend success
        return {"ok": True}

    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _hits[ip] = [t for t in _hits[ip] if now - t < 3600]
    if len(_hits[ip]) >= 5:
        raise HTTPException(429, "Too many messages. Try again in an hour.")
    _hits[ip].append(now)

    record = {"time": now, **body.model_dump(exclude={"website"})}
    with MESSAGES.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")
    return {"ok": True}


@app.get("/pika-assistant.gltf", include_in_schema=False)
def robot_model():
    return FileResponse(BASE / "pika-assistant.gltf", media_type="model/gltf+json")


# ---------- Static site (must be last) ----------
app.mount("/", StaticFiles(directory=BASE / "static", html=True), name="static")
