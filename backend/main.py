"""
main.py — FastAPI entry point
Endpoints: GET /health, POST /upload, POST /query
"""

import os
import shutil
import traceback
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List

from rag import rebuild_index, answer_question

# ── Paths ─────────────────────────────────────────────────────────────────────
DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).parent.parent))
DOCUMENTS_DIR = DATA_DIR / "documents"
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

# The Docker deployment builds the React app into this location. Mounting it
# after the API routes makes the browser and API share one public origin.
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"


def _cors_origins() -> list[str]:
    """Return explicitly configured cross-origin clients for development."""
    configured = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in configured.split(",") if origin.strip()]

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="RAG QA System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


# ── Upload ────────────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload(files: List[UploadFile] = File(...)):
    """
    Accept one or more PDFs, save them, and ingest into FAISS.
    Returns the list of processed filenames.
    """
    processed = []
    saved_paths = []
    for file in files:
        original_name = file.filename or ""
        safe_name = Path(original_name).name
        if not safe_name or not safe_name.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{original_name or 'Uploaded file'} is not a PDF.")

        # Keep uploads inside the documents directory even when a client sends
        # path-like filenames. The endpoint response shape remains unchanged.
        dest = DOCUMENTS_DIR / safe_name
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)

        if dest.stat().st_size == 0:
            dest.unlink(missing_ok=True)
            raise HTTPException(status_code=400, detail=f"'{safe_name}' is empty.")

        processed.append(safe_name)
        saved_paths.append(str(dest))

    try:
        # A single upload request is one active knowledge base. Rebuilding once
        # preserves multi-file uploads while excluding every earlier batch.
        rebuild_index(saved_paths)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index uploaded documents: {str(e)}"
        )

    return {"message": "Uploaded and indexed.", "files": processed}


# ── Query ─────────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    question: str


@app.post("/query")
def query(req: QueryRequest):
    """
    Accept a natural language question.
    Returns the generated answer and the retrieved source chunks.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = answer_question(req.question)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


# Keep this last: API and documentation routes must be matched before the SPA.
if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
