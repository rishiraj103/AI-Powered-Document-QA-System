# AI-Powered Document QA System (RAG)

A presentation-ready document intelligence application implementing **Retrieval-Augmented Generation** with:

- **Backend**: FastAPI + LangChain + FAISS + PyMuPDF + Google Gemini
- **Frontend**: React + Vite + TailwindCSS

The frontend includes multi-file drag-and-drop, a session document library, live backend status, question suggestions, Markdown answers, searchable numbered source cards, source copying, keyboard shortcuts, and local recent-question history.

---

## Project Structure

```
rag project/
├── backend/
│   ├── main.py           # FastAPI: /health, /upload, /query
│   ├── rag.py            # RAG pipeline (extract → chunk → embed → FAISS → Gemini)
│   ├── requirements.txt
│   └── .env              # GOOGLE_API_KEY goes here
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Single-page UI
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── documents/            # Uploaded PDFs are saved here
└── faiss_index/          # Persisted FAISS vector index
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key

---

## Setup

### 1. Get a Google API Key

Go to https://aistudio.google.com/app/apikey and create a free API key.

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Edit `backend/.env`:
```
GOOGLE_API_KEY=your_actual_key_here
```

Start the server:
```bash
uvicorn main:app --reload
```

The API runs at **http://localhost:8000**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI opens at **http://localhost:5173**

---

## RAG Pipeline

```
PDF
 └─► PyMuPDF (text extraction, page by page)
      └─► RecursiveCharacterTextSplitter (chunk_size=1000, overlap=200)
           └─► GoogleGenerativeAIEmbeddings (models/embedding-001)
                └─► FAISS (persisted to faiss_index/)
                     └─► similarity_search (top-4 chunks)
                          └─► Gemini 1.5 Flash (generate answer)
                               └─► { answer, sources }
```

---

## API Reference

| Method | Endpoint  | Body / Params                  | Response                          |
|--------|-----------|--------------------------------|-----------------------------------|
| GET    | /health   | —                              | `{ "status": "ok" }`             |
| POST   | /upload   | multipart: `files` (PDF list)  | `{ "message": ..., "files": [] }`|
| POST   | /query    | JSON: `{ "question": "..." }`  | `{ "answer": ..., "sources": [] }`|

---

## How to Use

1. Open **http://localhost:5173**
2. Click "Upload & Index" and select one or more PDFs
3. Type a question about the document content
4. Click **Ask** (or press Enter)
5. Read the AI-generated answer and expand the retrieved chunks to see the source text

---

## Dependencies

### Backend (`requirements.txt`)
| Package | Purpose |
|---------|---------|
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server |
| `python-multipart` | File upload support |
| `pymupdf` | PDF text extraction |
| `langchain` | RAG orchestration |
| `langchain-google-genai` | Gemini + Google Embeddings |
| `langchain-community` | FAISS integration |
| `faiss-cpu` | Vector similarity search |
| `python-dotenv` | Load `.env` file |

### Frontend (`package.json`)
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `vite` | Dev server & bundler |
| `tailwindcss` | Utility-first CSS |
| `axios` | HTTP client |
