"""Chat API routes."""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.chat import Chat, Message, MessageRole
from app.schemas.chat import (
    ChatCreate, ChatResponse, ChatListResponse, 
    MessageResponse, ChatSendMessage, ChatMessageResponse
)
from app.services.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/", response_model=List[ChatListResponse])
async def get_chats(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Get all chats for the current user."""
    chats = db.query(Chat).filter(
        Chat.user_id == user_id
    ).order_by(Chat.updated_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for chat in chats:
        message_count = len(chat.messages)
        last_message = None
        if chat.messages:
            last_msg = chat.messages[-1]
            last_message = last_msg.content[:100] if last_msg.content else None
        
        result.append(ChatListResponse(
            id=chat.id,
            title=chat.title,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            message_count=message_count,
            last_message=last_message
        ))
    
    return result


@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_data: ChatCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new chat."""
    chat = Chat(
        user_id=user_id,
        title=chat_data.title or "New Chat"
    )
    
    db.add(chat)
    db.commit()
    db.refresh(chat)
    
    return ChatResponse.model_validate(chat)


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific chat with all messages."""
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == user_id
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )
    
    return ChatResponse.model_validate(chat)


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a chat and all its messages."""
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == user_id
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )
    
    db.delete(chat)
    db.commit()
    
    return {"message": "Chat deleted successfully"}


@router.post("/send", response_model=ChatMessageResponse)
async def send_message(
    message_data: ChatSendMessage,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response."""
    chat_id = message_data.chat_id
    
    # Create new chat if needed
    if not chat_id:
        # Generate title from first message
        title = await rag_service.generate_chat_title(message_data.message)
        
        chat = Chat(
            user_id=user_id,
            title=title
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        chat_id = chat.id
    else:
        # Verify chat belongs to user
        chat = db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_id == user_id
        ).first()
        
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
    
    # Get chat history for context
    history = db.query(Message).filter(
        Message.chat_id == chat_id
    ).order_by(Message.created_at.desc()).limit(10).all()
    
    chat_history = [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(history)
    ]
    
    # Save user message
    user_message = Message(
        chat_id=chat_id,
        role=MessageRole.USER.value,
        content=message_data.message
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Generate AI response
    try:
        rag_response = await rag_service.generate_response(
            user_id=user_id,
            query=message_data.message,
            chat_history=chat_history
        )
        
        response_text = rag_response["response"]
        sources = rag_response.get("sources", [])
        
    except Exception as e:
        response_text = f"I apologize, but I encountered an error while processing your request. Please try again."
        sources = []
    
    # Save assistant message
    assistant_message = Message(
        chat_id=chat_id,
        role=MessageRole.ASSISTANT.value,
        content=response_text,
        sources=json.dumps(sources) if sources else None
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    
    # Update chat timestamp
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    db.commit()
    
    return ChatMessageResponse(
        user_message=MessageResponse.model_validate(user_message),
        assistant_message=MessageResponse.model_validate(assistant_message),
        chat_id=chat_id,
        sources=sources
    )


@router.put("/{chat_id}/title")
async def update_chat_title(
    chat_id: int,
    title: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a chat's title."""
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == user_id
    ).first()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )
    
    chat.title = title
    db.commit()
    
    return {"message": "Chat title updated", "title": title}
