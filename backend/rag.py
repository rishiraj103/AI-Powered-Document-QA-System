"""
rag.py — Complete RAG pipeline

Uses the google-genai SDK directly (not through langchain-google-genai)
so it works with all Google AI Studio API key formats (including AQ. keys).

Pipeline:
  ingest_pdf(path)
    1. PyMuPDF      → extract text from every page
    2. RecursiveCharacterTextSplitter → split into chunks
    3. google-genai embed_content     → embed each chunk
    4. FAISS                          → store & persist index

  answer_question(question)
    1. Load FAISS index from disk
    2. Similarity search → top-4 chunks
    3. Build a prompt with those chunks as context
    4. google-genai generate_content  → generate answer
    5. Return { answer, sources }
"""

import os
import time
from pathlib import Path

import fitz  # PyMuPDF
from dotenv import load_dotenv
from google import genai

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from langchain_core.documents import Document

# ── Config ────────────────────────────────────────────────────────────────────
load_dotenv()

FAISS_DIR = str(Path(__file__).parent.parent / "faiss_index")
EMBEDDING_MODEL = "gemini-embedding-2-preview"
# Fallback list of models in case one has 429 quota exhaustion or 404
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]
CHUNK_SIZE      = 1000
CHUNK_OVERLAP   = 200
TOP_K           = 4


# Single google-genai client reused across all calls
_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


def _get_available_llm_models() -> list[str]:
    """Dynamically query Google AI Studio to find available generateContent models for this API key."""
    try:
        models = []
        for m in _client.models.list():
            # Match models that support generateContent
            if hasattr(m, 'supported_actions') and 'generateContent' in m.supported_actions:
                name = m.name.replace("models/", "")
                models.append(name)
        if models:
            print(f"[models] Discovered supported models: {models}")
            return models
    except Exception as e:
        print(f"[models] Model listing failed ({e}), using default fallbacks.")
    
    return [
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-lite",
    ]


def _embed_single_with_retry(text: str) -> list[float]:
    """Embed a single string with automatic retry on 429 rate limit."""
    for attempt in range(5):
        try:
            result = _client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
            )
            return result.embeddings[0].values
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"[embed] Quota pause (429)... waiting 5s (attempt {attempt+1}/5)")
                time.sleep(5)
            else:
                raise e
    raise RuntimeError("Embedding failed after 5 rate limit retries.")


# ── Custom Embeddings wrapper ─────────────────────────────────────────────────

class GeminiEmbeddings(Embeddings):
    """
    Thin LangChain-compatible wrapper around google-genai embed_content.
    Allows FAISS (a LangChain vector store) to use google-genai embeddings.
    """

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of document chunks — one API call per text with rate limit protection."""
        embeddings = []
        for i, text in enumerate(texts):
            embeddings.append(_embed_single_with_retry(text))
            # Small delay to respect free-tier per-minute quota
            time.sleep(0.1)
        return embeddings

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query string."""
        return _embed_single_with_retry(text)


class LocalSentenceEmbeddings(Embeddings):
    """
    Direct sentence-transformers wrapper for LangChain.
    Fast batch embedding on CPU with zero network calls or API key dependencies.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, text: str) -> list[float]:
        embedding = self.model.encode(text, show_progress_bar=False)
        return embedding.tolist()


def _get_embeddings():
    """Return local SentenceTransformer embeddings if available, otherwise GeminiEmbeddings."""
    try:
        print("[embeddings] Using local SentenceTransformer (all-MiniLM-L6-v2).")
        return LocalSentenceEmbeddings("all-MiniLM-L6-v2")
    except Exception as e:
        print(f"[embeddings] Local SentenceTransformer unavailable ({e}), falling back to GeminiEmbeddings.")
        return GeminiEmbeddings()


# ── Ingest ────────────────────────────────────────────────────────────────────

def extract_text(pdf_path: str) -> list[Document]:
    """
    Use PyMuPDF to extract text from every page of the PDF.
    Returns a list of LangChain Documents (one per page).
    """
    docs = []
    pdf = fitz.open(pdf_path)
    for page_num, page in enumerate(pdf, start=1):
        text = page.get_text()
        if text.strip():           # skip empty pages
            docs.append(Document(
                page_content=text,
                metadata={"source": Path(pdf_path).name, "page": page_num},
            ))
    pdf.close()
    return docs


def split_documents(docs: list[Document]) -> list[Document]:
    """Split page-level Documents into smaller overlapping chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    return splitter.split_documents(docs)


def ingest_pdf(pdf_path: str) -> None:
    """Build a fresh FAISS index from one PDF."""
    rebuild_index([pdf_path])


def rebuild_index(pdf_paths: list[str]) -> None:
    """Build a fresh FAISS index containing only the supplied PDF batch."""
    all_chunks = []

    for pdf_path in pdf_paths:
        print(f"[ingest] Processing active batch document: {pdf_path}")
        pages = extract_text(pdf_path)
        chunks = split_documents(pages)
        print(f"[ingest] {len(pages)} pages -> {len(chunks)} chunks")
        all_chunks.extend(chunks)

    if not all_chunks:
        raise ValueError("No extractable text was found in the uploaded PDFs.")

    embeddings = _get_embeddings()
    db = FAISS.from_documents(all_chunks, embeddings)
    db.save_local(FAISS_DIR)
    print(
        f"[ingest] Replaced active FAISS index with "
        f"{len(all_chunks)} chunks from {len(pdf_paths)} document(s)."
    )


# ── Query ─────────────────────────────────────────────────────────────────────

PROMPT_TEMPLATE = """You are a helpful assistant that answers questions based on the provided document context.

Context:
{context}

Question: {question}

Answer the question using only the information in the context above.
If the answer is not found in the context, say "I don't have enough information to answer this question."

Answer:"""


def answer_question(question: str) -> dict:
    """
    Query pipeline:
      1. Load FAISS index
      2. Retrieve top-k similar chunks via semantic search
      3. Build prompt with retrieved context
      4. Call Gemini to generate an answer
      5. Return { answer, sources }
    """
    index_file = Path(FAISS_DIR) / "index.faiss"
    if not index_file.exists():
        return {
            "answer": "No documents have been uploaded yet. Please upload a PDF first.",
            "sources": [],
        }

    embeddings = _get_embeddings()
    db = FAISS.load_local(
        FAISS_DIR,
        embeddings,
        allow_dangerous_deserialization=True,
    )

    # Semantic search → top-k chunks
    retrieved_docs = db.similarity_search(question, k=TOP_K)

    # Build context string
    context = "\n\n---\n\n".join(doc.page_content for doc in retrieved_docs)

    # Build the full prompt
    prompt = PROMPT_TEMPLATE.format(context=context, question=question)

    # Call Gemini with fallback across available models
    answer = None
    last_error = None
    available_models = _get_available_llm_models()

    for model_name in available_models:
        if answer:
            break
        try:
            print(f"[query] Trying model: {model_name}")
            response = _client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response.text:
                answer = response.text.strip()
                print(f"[query] Success with model: {model_name}")
                break
        except Exception as e:
            err_str = str(e)
            print(f"[query] Model {model_name} failed: {e}")
            last_error = e
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                # Quota exceeded on this model, move to next model in list immediately
                continue
            else:
                continue

    if not answer:
        raise RuntimeError(f"All available Gemini models failed. Last error: {last_error}")

    # Format sources for the frontend
    sources = [
        {
            "content": doc.page_content,
            "source":  doc.metadata.get("source", "unknown"),
            "page":    doc.metadata.get("page", "?"),
        }
        for doc in retrieved_docs
    ]

    return {"answer": answer, "sources": sources}
