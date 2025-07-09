import os
import shutil
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from llama_index.core import Settings, VectorStoreIndex, SimpleDirectoryReader
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.groq import Groq

# === Load env variables ===
load_dotenv()

# === App Setup ===
app = FastAPI()
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# === Enable CORS (optional for frontend fetch) ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Serve Static Files (Frontend) ===
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/templates", StaticFiles(directory="templates"), name="templates")


# === Global State ===
query_engine = None

# === Configure LLM ===
try:
    Settings.llm = Groq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama3-8b-8192"
    )
except Exception as e:
    print(f"[ERROR] LLM Init Failed: {e}")
    Settings.llm = None

# === Configure Embeddings ===
try:
    Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
except Exception as e:
    print(f"[ERROR] Embedding Init Failed: {e}")
    Settings.embed_model = None

# === Helper: Clean Directories ===
def clean_directories():
    for d in [UPLOAD_FOLDER, "storage"]:
        if os.path.exists(d):
            shutil.rmtree(d)
        os.makedirs(d, exist_ok=True)

# === Routes ===

@app.get("/", response_class=HTMLResponse)
async def home():
    with open("templates/home.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/chat", response_class=HTMLResponse)
async def chat():
    with open("templates/chat.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/contact", response_class=HTMLResponse)
async def contact():
    with open("templates/contact.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)):
    global query_engine
    clean_directories()
    saved_paths = []

    for file in files:
        if not file.filename.lower().endswith(('.pdf', '.docx', '.txt')):
            return JSONResponse(status_code=400, content={"error": "Unsupported file type"})
        path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(path, "wb") as f:
            content = await file.read()
            f.write(content)
            saved_paths.append(path)

    try:
        documents = SimpleDirectoryReader(input_files=saved_paths).load_data()
        node_parser = SentenceSplitter(chunk_size=512, chunk_overlap=50)
        nodes = node_parser.get_nodes_from_documents(documents)
        index = VectorStoreIndex(nodes)
        query_engine = index.as_query_engine()

        return {"message": f"{len(saved_paths)} files uploaded and processed successfully."}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/ask")
async def ask(request: Request):
    global query_engine
    if query_engine is None:
        return JSONResponse(status_code=400, content={"error": "No document uploaded yet."})

    try:
        data = await request.json()
        query = data.get("query")
        if not query:
            return JSONResponse(status_code=400, content={"error": "Query is empty."})

        response = query_engine.query(query)
        return {"answer": str(response)}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
