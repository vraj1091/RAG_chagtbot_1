"""Pydantic schemas for chat-related operations."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class MessageCreate(BaseModel):
    """Schema for creating a new message."""
    content: str
    chat_id: Optional[int] = None  # If None, creates a new chat


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: int
    chat_id: int
    role: str
    content: str
    sources: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatCreate(BaseModel):
    """Schema for creating a new chat."""
    title: Optional[str] = "New Chat"


class ChatResponse(BaseModel):
    """Schema for chat response with messages."""
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True


class ChatListResponse(BaseModel):
    """Schema for chat list item."""
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class ChatSendMessage(BaseModel):
    """Schema for sending a message to chat."""
    message: str
    chat_id: Optional[int] = None


class ChatMessageResponse(BaseModel):
    """Schema for chat message response with AI reply."""
    user_message: MessageResponse
    assistant_message: MessageResponse
    chat_id: int
    sources: Optional[List[dict]] = None
