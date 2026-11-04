import json
import time
from collections import defaultdict
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE = Path(__file__).parent
MESSAGES = BASE / "messages.jsonl"

app = FastAPI(title="Mirajul Portfolio")

# ---------- Data: edit these ----------
PROJECTS = [
    {
        "title": "VideoMind",
        "flow": ["URL", "transcribe", "analyze", "UI"],
        "description": "AI-powered YouTube video analysis. Paste a link, get structured insight without watching the whole video.",
        "stack": ["Python", "FastAPI", "ML", "React"],
        "metric_label": "status",
        "metric": "in development",
        "link": "",
        "image": "img/video-mind.svg",
    },
    {
        "title": "Project Two",
        "flow": ["data", "model", "API"],
        "description": "Replace with a one-line problem statement and what you shipped. Lead with the result, not the stack.",
        "stack": ["Python", "FastAPI"],
        "metric_label": "result",
        "metric": "add a number",
        "link": "",
        "image": "img/data-pipeline.svg",
    },
    {
        "title": "Project Three",
        "flow": ["input", "pipeline", "dashboard"],
        "description": "Replace with your strongest frontend piece. A screenshot or short clip works well here.",
        "stack": ["React", "TypeScript"],
        "metric_label": "result",
        "metric": "add a number",
        "link": "",
        "image": "img/interface-lab.svg",
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


# ---------- Static site (must be last) ----------
app.mount("/", StaticFiles(directory=BASE / "static", html=True), name="static")
