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
from pydantic import BaseModel
from typing import List

from rag import ingest_pdf, answer_question

# ── Paths ─────────────────────────────────────────────────────────────────────
DOCUMENTS_DIR = Path(__file__).parent.parent / "documents"
DOCUMENTS_DIR.mkdir(exist_ok=True)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="RAG QA System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # OK for a local university project
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
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF.")

        dest = DOCUMENTS_DIR / file.filename
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            ingest_pdf(str(dest))
            processed.append(file.filename)
        except Exception as e:
            # Print full traceback to backend terminal for debugging
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to index '{file.filename}': {str(e)}"
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
