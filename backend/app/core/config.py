"""Application configuration settings."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    GEMINI_API_KEY: str = "AIzaSyBI0ArhiSoljxmEZ4y51mf-pv5lI9A3Zos"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/rag_chatbot.db"
    
    # CORS
    CORS_ORIGINS: str = "https://rag-chatbot-frontend-1o3.onrender.com,https://rag-chatbot-frontend-1cx3.onrender.com"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    UPLOAD_DIR: str = "./uploads"
    
    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    # Vector Store
    CHROMA_PERSIST_DIR: str = "./data/chroma"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    @property
    def upload_path(self) -> Path:
        """Get the upload directory path."""
        path = self.BASE_DIR / self.UPLOAD_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    @property
    def data_path(self) -> Path:
        """Get the data directory path."""
        path = self.BASE_DIR / "data"
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    @property
    def chroma_path(self) -> Path:
        """Get the ChromaDB directory path."""
        path = Path(self.CHROMA_PERSIST_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# Global settings instance
settings = Settings()
