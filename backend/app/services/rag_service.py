"""RAG service for retrieval-augmented generation using Gemini API."""
import logging
from typing import List, Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    """Service for RAG-based chat using Gemini API."""
    
    def __init__(self):
        """Initialize the RAG service with Gemini API."""
        self.client = None
        # Using gemini-2.0-flash (latest stable model)
        self.model_name = "gemini-2.0-flash"
        self._vector_store = None
        self._configured = False
    
    def _ensure_configured(self):
        """Lazy configuration of Gemini client."""
        if self._configured:
            return
        self._configured = True
        self._configure_gemini()
    
    def _get_vector_store(self):
        """Lazy import of vector store to avoid import-time crashes."""
        if self._vector_store is None:
            from app.services.vector_store import vector_store
            self._vector_store = vector_store
        return self._vector_store
    
    def _configure_gemini(self):
        """Configure the Gemini API client."""
        if not settings.GEMINI_API_KEY:
            logger.error("Gemini API key not configured! Set GEMINI_API_KEY environment variable.")
            return
        
        try:
            import google.generativeai as genai
            # Configure the API
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Create the model
            self.client = genai.GenerativeModel(self.model_name)
            logger.info(f"✓ Gemini API configured successfully with {self.model_name}")
        except ImportError as e:
            logger.error(f"Failed to import google.generativeai: {str(e)}. Install with: pip install google-generativeai")
            self.client = None
        except Exception as e:
            logger.error(f"Failed to configure Gemini API: {str(e)}")
            self.client = None
    
    def _build_context_prompt(
        self, 
        query: str, 
        context_docs: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Build the prompt with context from retrieved documents."""
        
        # System instruction
        system_prompt = """You are a helpful AI assistant that answers questions based on the provided context and general knowledge.

INSTRUCTIONS:
1. If relevant context documents are provided, use them to inform your answer
2. Cite specific sources when using information from the context
3. If the context doesn't contain relevant information, use your general knowledge
4. Be helpful, accurate, and concise
5. If you don't know something, say so clearly

"""
        
        # Add context if available
        context_section = ""
        if context_docs:
            context_section = "CONTEXT FROM UPLOADED DOCUMENTS:\n"
            context_section += "=" * 50 + "\n"
            
            for i, doc in enumerate(context_docs, 1):
                filename = doc.get('metadata', {}).get('filename', 'Unknown')
                content = doc.get('content', '')
                relevance = doc.get('relevance_score', 0)
                
                context_section += f"\n[Source {i}: {filename} (Relevance: {relevance:.2f})]\n"
                context_section += f"{content}\n"
                context_section += "-" * 30 + "\n"
            
            context_section += "=" * 50 + "\n\n"
        else:
            context_section = "No relevant documents found in your uploads. I'll answer based on my general knowledge.\n\n"
        
        # Add chat history if available
        history_section = ""
        if chat_history and len(chat_history) > 0:
            history_section = "RECENT CONVERSATION:\n"
            for msg in chat_history[-6:]:  # Last 3 exchanges
                role = "User" if msg.get('role') == 'user' else "Assistant"
                content = msg.get('content', '')[:500]  # Truncate for context
                history_section += f"{role}: {content}\n"
            history_section += "\n"
        
        # Build final prompt
        full_prompt = f"""{system_prompt}
{context_section}
{history_section}
USER QUESTION: {query}

Please provide a helpful and accurate response:"""
        
        return full_prompt
    
    async def generate_response(
        self,
        user_id: int,
        query: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Generate a response using RAG."""
        try:
            self._ensure_configured()
            
            if not self.client:
                logger.error("Gemini client not initialized - API key missing or import failed")
                return {
                    "response": "I'm sorry, but I'm currently unable to respond. The AI service is not properly configured. Please ensure the Gemini API is set up correctly.",
                    "sources": [],
                    "used_context": False
                }
            
            # Search for relevant context
            try:
                vs = self._get_vector_store()
                context_docs = vs.search(user_id, query, n_results=5)
            except Exception as e:
                logger.warning(f"Vector store search failed: {str(e)}. Continuing without context.")
                context_docs = []
            
            # Filter by relevance threshold
            relevant_docs = [
                doc for doc in context_docs 
                if doc.get('relevance_score', 0) > 0.3
            ]
            
            # Build the prompt
            prompt = self._build_context_prompt(query, relevant_docs, chat_history)
            
            # Generate response using Gemini
            response = await self._generate_gemini_response(prompt)
            
            # Format sources for the response
            sources = []
            if relevant_docs:
                seen_files = set()
                for doc in relevant_docs:
                    filename = doc.get('metadata', {}).get('filename', 'Unknown')
                    if filename not in seen_files:
                        sources.append({
                            "filename": filename,
                            "relevance": round(doc.get('relevance_score', 0), 2),
                            "chunk_preview": doc.get('content', '')[:200] + "..."
                        })
                        seen_files.add(filename)
            
            return {
                "response": response,
                "sources": sources,
                "used_context": len(relevant_docs) > 0
            }
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {type(e).__name__}: {str(e)}", exc_info=True)
            # Check for quota exceeded
            if "429" in str(e) or "quota" in str(e).lower() or "RESOURCE_EXHAUSTED" in str(e):
                return {
                    "response": "I apologize, but the API rate limit has been exceeded. Please wait a moment and try again.",
                    "sources": [],
                    "used_context": False
                }
            return {
                "response": f"I apologize, but I encountered an error while processing your request: {type(e).__name__}. Please try again.",
                "sources": [],
                "used_context": False
            }
    
    async def _generate_gemini_response(self, prompt: str) -> str:
        """Generate a response from Gemini API."""
        try:
            if not self.client:
                raise ValueError("Gemini client not initialized")
            
            # Generate content using google.generativeai
            response = self.client.generate_content(prompt)
            
            # Get the text from response
            if response and hasattr(response, 'text') and response.text:
                return response.text
            else:
                return "I apologize, but I couldn't generate a response for your question. Please try rephrasing it."
                
        except Exception as e:
            error_str = str(e)
            logger.error(f"Gemini API error: {error_str}")
            
            # Check for rate limit
            if "429" in error_str or "quota" in error_str.lower():
                raise ValueError("API rate limit exceeded. Please wait and try again.")
            raise
    
    async def generate_chat_title(self, first_message: str) -> str:
        """Generate a title for a chat based on the first message."""
        try:
            self._ensure_configured()
            
            if not self.client:
                return "New Conversation"
            
            prompt = f"""Generate a short, descriptive title (5 words max) for a conversation that starts with this message:

"{first_message}"

Respond with only the title, no quotes or punctuation at the end."""
            
            response = self.client.generate_content(prompt)
            
            if response and hasattr(response, 'text') and response.text:
                title = response.text.strip()[:100]  # Limit length
                return title
            
            return "New Conversation"
            
        except Exception as e:
            logger.error(f"Error generating chat title: {str(e)}")
            return "New Conversation"


# Global instance - does NOT connect to anything until first use
rag_service = RAGService()
