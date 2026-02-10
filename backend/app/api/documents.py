"""Document upload and management API routes."""
import os
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.config import settings
from app.models.document import Document, DocumentStatus, DocumentType
from app.schemas.document import (
    DocumentResponse, DocumentListResponse, 
    DocumentUploadResponse, DocumentDeleteResponse
)
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import vector_store

router = APIRouter(prefix="/documents", tags=["Documents"])


async def process_document_background(
    document_id: int,
    user_id: int,
    file_path: str,
    file_type: str,
    db_url: str
):
    """Background task to process a document."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Get document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return
        
        # Update status to processing
        document.status = DocumentStatus.PROCESSING.value
        db.commit()
        
        # Extract text
        text = DocumentProcessor.extract_text(file_path, file_type)
        
        if not text or not text.strip():
            document.status = DocumentStatus.FAILED.value
            document.error_message = "No text could be extracted from the document"
            db.commit()
            return
        
        # Add to vector store
        chunk_count = vector_store.add_document(
            user_id=user_id,
            document_id=document_id,
            text=text,
            filename=document.original_filename
        )
        
        # Update document status
        document.status = DocumentStatus.COMPLETED.value
        document.chunk_count = chunk_count
        document.processed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        # Update status to failed
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = DocumentStatus.FAILED.value
            document.error_message = str(e)[:500]
            db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Upload one or more documents for processing."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided"
        )
    
    uploaded_documents = []
    failed_count = 0
    
    for file in files:
        try:
            # Check file type
            if not DocumentProcessor.is_supported(file.filename):
                failed_count += 1
                continue
            
            # Check file size
            content = await file.read()
            if len(content) > settings.max_file_size_bytes:
                failed_count += 1
                continue
            
            # Save file
            file_path, unique_filename = await DocumentProcessor.save_uploaded_file(
                content, file.filename, user_id
            )
            
            # Determine file type
            file_type = DocumentProcessor.get_file_type(file.filename)
            
            # Create document record
            document = Document(
                user_id=user_id,
                filename=unique_filename,
                original_filename=file.filename,
                file_path=file_path,
                file_type=file_type,
                file_size=len(content),
                mime_type=file.content_type,
                status=DocumentStatus.PENDING.value
            )
            
            db.add(document)
            db.commit()
            db.refresh(document)
            
            # Schedule background processing
            background_tasks.add_task(
                process_document_background,
                document.id,
                user_id,
                file_path,
                file_type,
                settings.DATABASE_URL
            )
            
            uploaded_documents.append(DocumentResponse.model_validate(document))
            
        except Exception as e:
            failed_count += 1
            continue
    
    return DocumentUploadResponse(
        message=f"Uploaded {len(uploaded_documents)} file(s) for processing",
        documents=uploaded_documents,
        success_count=len(uploaded_documents),
        failed_count=failed_count
    )


@router.get("/", response_model=DocumentListResponse)
async def get_documents(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    page: int = 1,
    per_page: int = 20,
    status_filter: str = None
):
    """Get all documents for the current user."""
    query = db.query(Document).filter(Document.user_id == user_id)
    
    if status_filter:
        query = query.filter(Document.status == status_filter)
    
    total = query.count()
    
    documents = query.order_by(
        Document.created_at.desc()
    ).offset((page - 1) * per_page).limit(per_page).all()
    
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific document."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", response_model=DocumentDeleteResponse)
async def delete_document(
    document_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a document."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete from vector store
    vector_store.delete_document(user_id, document_id)
    
    # Delete file from filesystem
    DocumentProcessor.delete_file(document.file_path)
    
    # Delete database record
    db.delete(document)
    db.commit()
    
    return DocumentDeleteResponse(
        message="Document deleted successfully",
        deleted_id=document_id
    )


@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Reprocess a failed document."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if file still exists
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document file not found on server"
        )
    
    # Delete existing vectors
    vector_store.delete_document(user_id, document_id)
    
    # Reset status
    document.status = DocumentStatus.PENDING.value
    document.error_message = None
    document.chunk_count = 0
    document.processed_at = None
    db.commit()
    
    # Schedule reprocessing
    background_tasks.add_task(
        process_document_background,
        document.id,
        user_id,
        document.file_path,
        document.file_type,
        settings.DATABASE_URL
    )
    
    return {"message": "Document queued for reprocessing"}
