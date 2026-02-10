"""Vector store service for document indexing and retrieval."""
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
import json

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing document embeddings and retrieval."""
    
    _instance = None
    _embedding_model = None
    _client = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern for vector store service."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def _ensure_initialized(self):
        """Lazy initialization - only load heavy dependencies when first needed."""
        if self._initialized:
            return
        
        try:
            logger.info("Initializing vector store service (lazy)...")
            
            # Import heavy dependencies only when needed
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            from sentence_transformers import SentenceTransformer
            
            # Initialize embedding model
            self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Initialize ChromaDB client
            chroma_path = Path(settings.CHROMA_PERSIST_DIR)
            chroma_path.mkdir(parents=True, exist_ok=True)
            
            self._client = chromadb.PersistentClient(
                path=str(chroma_path),
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            self._initialized = True
            logger.info("Vector store service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {str(e)}")
            raise
    
    def _get_collection(self, user_id: int):
        """Get or create a collection for a user."""
        self._ensure_initialized()
        collection_name = f"user_{user_id}_documents"
        return self._client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks."""
        if not text or len(text) == 0:
            return []
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at a paragraph or sentence boundary
            if end < len(text):
                # Look for paragraph break
                para_break = text.rfind('\n\n', start, end)
                if para_break > start + chunk_size // 2:
                    end = para_break + 2
                else:
                    # Look for sentence break
                    for punct in ['. ', '! ', '? ', '\n']:
                        sent_break = text.rfind(punct, start, end)
                        if sent_break > start + chunk_size // 2:
                            end = sent_break + len(punct)
                            break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap if end < len(text) else end
        
        return chunks
    
    def add_document(
        self, 
        user_id: int, 
        document_id: int, 
        text: str, 
        filename: str
    ) -> int:
        """Add a document to the vector store."""
        try:
            self._ensure_initialized()
            collection = self._get_collection(user_id)
            
            # Chunk the text
            chunks = self._chunk_text(text)
            
            if not chunks:
                logger.warning(f"No chunks created for document {document_id}")
                return 0
            
            # Generate embeddings
            embeddings = self._embedding_model.encode(chunks).tolist()
            
            # Prepare IDs and metadata
            ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
                for i in range(len(chunks))
            ]
            
            # Add to collection
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas
            )
            
            logger.info(f"Added {len(chunks)} chunks for document {document_id}")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Error adding document to vector store: {str(e)}")
            raise
    
    def search(
        self, 
        user_id: int, 
        query: str, 
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for relevant document chunks."""
        try:
            self._ensure_initialized()
            collection = self._get_collection(user_id)
            
            # Check if collection has any documents
            if collection.count() == 0:
                return []
            
            # Generate query embedding
            query_embedding = self._embedding_model.encode([query]).tolist()
            
            # Search
            results = collection.query(
                query_embeddings=query_embedding,
                n_results=min(n_results, collection.count()),
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            if results and results['documents'] and len(results['documents']) > 0:
                for i, doc in enumerate(results['documents'][0]):
                    formatted_results.append({
                        "content": doc,
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "distance": results['distances'][0][i] if results['distances'] else 0,
                        "relevance_score": 1 - (results['distances'][0][i] if results['distances'] else 0)
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            return []
    
    def delete_document(self, user_id: int, document_id: int) -> bool:
        """Delete a document from the vector store."""
        try:
            self._ensure_initialized()
            collection = self._get_collection(user_id)
            
            # Get all chunk IDs for this document
            results = collection.get(
                where={"document_id": document_id},
                include=["metadatas"]
            )
            
            if results and results['ids']:
                collection.delete(ids=results['ids'])
                logger.info(f"Deleted {len(results['ids'])} chunks for document {document_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting document from vector store: {str(e)}")
            return False
    
    def get_document_count(self, user_id: int) -> int:
        """Get the total number of document chunks for a user."""
        try:
            self._ensure_initialized()
            collection = self._get_collection(user_id)
            return collection.count()
        except Exception as e:
            logger.error(f"Error getting document count: {str(e)}")
            return 0
    
    def clear_user_data(self, user_id: int) -> bool:
        """Clear all vector store data for a user."""
        try:
            self._ensure_initialized()
            collection_name = f"user_{user_id}_documents"
            self._client.delete_collection(collection_name)
            logger.info(f"Cleared vector store data for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error clearing user data: {str(e)}")
            return False


# Global instance - does NOT initialize heavy deps until first use
vector_store = VectorStoreService()
