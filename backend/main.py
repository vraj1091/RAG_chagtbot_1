"""Main FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.api import auth_router, chat_router, documents_router, history_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    # Startup
    logger.info("Starting RAG Chatbot API...")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Ensure required directories exist
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    settings.data_path.mkdir(parents=True, exist_ok=True)
    settings.chroma_path.mkdir(parents=True, exist_ok=True)
    logger.info("Required directories created")
    
    yield
    
    # Shutdown
    logger.info("Shutting down RAG Chatbot API...")


# Create FastAPI application
app = FastAPI(
    title="RAG Chatbot API",
    description="A Retrieval-Augmented Generation chatbot powered by Gemini API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS - ensure Render frontend URL is always included
cors_origins = list(set(settings.cors_origins_list + [
    "https://rag-chatbot-frontend-1cx3.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
]))
# Also handle case where env var might contain hostname without https://
cors_origins = [
    f"https://{o}" if not o.startswith("http") and "." in o else o
    for o in cors_origins
]
logger.info(f"CORS origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(history_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint returning API information."""
    return {
        "name": "RAG Chatbot API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        reload_excludes=["data", "uploads", "__pycache__", "*.db", "*.sqlite"]
    )
