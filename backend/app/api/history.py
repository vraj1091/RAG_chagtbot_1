"""History API routes for chat and document history."""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.chat import Chat, Message
from app.models.document import Document

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/overview")
async def get_history_overview(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get an overview of user's chat and document history."""
    # Chat statistics
    total_chats = db.query(Chat).filter(Chat.user_id == user_id).count()
    total_messages = db.query(Message).join(Chat).filter(Chat.user_id == user_id).count()
    
    # Document statistics
    total_documents = db.query(Document).filter(Document.user_id == user_id).count()
    completed_documents = db.query(Document).filter(
        Document.user_id == user_id,
        Document.status == "completed"
    ).count()
    
    # Recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_chats = db.query(Chat).filter(
        Chat.user_id == user_id,
        Chat.created_at >= week_ago
    ).count()
    
    recent_documents = db.query(Document).filter(
        Document.user_id == user_id,
        Document.created_at >= week_ago
    ).count()
    
    # Get last 5 chats
    last_chats = db.query(Chat).filter(
        Chat.user_id == user_id
    ).order_by(Chat.updated_at.desc()).limit(5).all()
    
    # Get last 5 documents
    last_documents = db.query(Document).filter(
        Document.user_id == user_id
    ).order_by(Document.created_at.desc()).limit(5).all()
    
    return {
        "statistics": {
            "total_chats": total_chats,
            "total_messages": total_messages,
            "total_documents": total_documents,
            "completed_documents": completed_documents,
            "recent_chats": recent_chats,
            "recent_documents": recent_documents
        },
        "recent_chats": [
            {
                "id": chat.id,
                "title": chat.title,
                "created_at": chat.created_at,
                "updated_at": chat.updated_at,
                "message_count": len(chat.messages)
            }
            for chat in last_chats
        ],
        "recent_documents": [
            {
                "id": doc.id,
                "filename": doc.original_filename,
                "file_type": doc.file_type,
                "status": doc.status,
                "created_at": doc.created_at
            }
            for doc in last_documents
        ]
    }


@router.get("/chats")
async def get_chat_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    """Get paginated chat history with filtering."""
    query = db.query(Chat).filter(Chat.user_id == user_id)
    
    # Apply search filter
    if search:
        query = query.filter(Chat.title.ilike(f"%{search}%"))
    
    # Apply date filters
    if date_from:
        query = query.filter(Chat.created_at >= date_from)
    if date_to:
        query = query.filter(Chat.created_at <= date_to)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    chats = query.order_by(
        Chat.updated_at.desc()
    ).offset((page - 1) * per_page).limit(per_page).all()
    
    return {
        "chats": [
            {
                "id": chat.id,
                "title": chat.title,
                "created_at": chat.created_at,
                "updated_at": chat.updated_at,
                "message_count": len(chat.messages),
                "preview": chat.messages[-1].content[:100] if chat.messages else None
            }
            for chat in chats
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page
        }
    }


@router.get("/documents")
async def get_document_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    file_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    """Get paginated document history with filtering."""
    query = db.query(Document).filter(Document.user_id == user_id)
    
    # Apply filters
    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search}%"))
    if status:
        query = query.filter(Document.status == status)
    if file_type:
        query = query.filter(Document.file_type == file_type)
    if date_from:
        query = query.filter(Document.created_at >= date_from)
    if date_to:
        query = query.filter(Document.created_at <= date_to)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    documents = query.order_by(
        Document.created_at.desc()
    ).offset((page - 1) * per_page).limit(per_page).all()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.original_filename,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "status": doc.status,
                "error_message": doc.error_message,
                "chunk_count": doc.chunk_count,
                "created_at": doc.created_at,
                "processed_at": doc.processed_at
            }
            for doc in documents
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page
        }
    }


@router.get("/activity")
async def get_activity_timeline(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    days: int = Query(7, ge=1, le=30)
):
    """Get activity timeline for the specified number of days."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get chat activity by day
    chat_activity = {}
    chats = db.query(Chat).filter(
        Chat.user_id == user_id,
        Chat.created_at >= start_date
    ).all()
    
    for chat in chats:
        date_str = chat.created_at.strftime("%Y-%m-%d")
        chat_activity[date_str] = chat_activity.get(date_str, 0) + 1
    
    # Get document activity by day
    document_activity = {}
    documents = db.query(Document).filter(
        Document.user_id == user_id,
        Document.created_at >= start_date
    ).all()
    
    for doc in documents:
        date_str = doc.created_at.strftime("%Y-%m-%d")
        document_activity[date_str] = document_activity.get(date_str, 0) + 1
    
    # Build timeline
    timeline = []
    current_date = start_date
    while current_date <= datetime.utcnow():
        date_str = current_date.strftime("%Y-%m-%d")
        timeline.append({
            "date": date_str,
            "chats": chat_activity.get(date_str, 0),
            "documents": document_activity.get(date_str, 0)
        })
        current_date += timedelta(days=1)
    
    return {
        "timeline": timeline,
        "period": {
            "start": start_date.isoformat(),
            "end": datetime.utcnow().isoformat(),
            "days": days
        }
    }
