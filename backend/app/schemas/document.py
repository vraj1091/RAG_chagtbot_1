"""Pydantic schemas for document-related operations."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class DocumentCreate(BaseModel):
    """Schema for creating a document record."""
    filename: str
    original_filename: str
    file_path: str
    file_type: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class DocumentResponse(BaseModel):
    """Schema for document response."""
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    chunk_count: int = 0
    created_at: datetime
    processed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Schema for list of documents."""
    documents: List[DocumentResponse]
    total: int
    page: int = 1
    per_page: int = 20


class DocumentUploadResponse(BaseModel):
    """Schema for document upload response."""
    message: str
    documents: List[DocumentResponse]
    success_count: int
    failed_count: int


class DocumentDeleteResponse(BaseModel):
    """Schema for document deletion response."""
    message: str
    deleted_id: int
