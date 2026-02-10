# API Documentation

This document describes the RAG Chatbot REST API endpoints.

## Base URL

- Development: `http://localhost:8000/api`
- Production: `https://your-domain.com/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### Register

Create a new user account.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "is_active": true,
    "is_verified": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Login

Authenticate and get access token.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { ... }
}
```

### Get Current User

Get the authenticated user's profile.

```http
GET /auth/me
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Chat Endpoints

### List Chats

Get all chats for the current user.

```http
GET /chat/
```

**Query Parameters:**
- `skip` (int, default: 0) - Number of chats to skip
- `limit` (int, default: 50) - Maximum chats to return

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Document Analysis",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z",
    "message_count": 5,
    "last_message": "That's helpful, thank you!"
  }
]
```

### Create Chat

Create a new chat session.

```http
POST /chat/
```

**Request Body:**
```json
{
  "title": "New Chat"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "New Chat",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "messages": []
}
```

### Get Chat

Get a specific chat with all messages.

```http
GET /chat/{chat_id}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Document Analysis",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:00:00Z",
  "messages": [
    {
      "id": 1,
      "chat_id": 1,
      "role": "user",
      "content": "What is in my documents?",
      "sources": null,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "chat_id": 1,
      "role": "assistant",
      "content": "Based on your uploaded documents...",
      "sources": "[{\"filename\": \"report.pdf\", \"relevance\": 0.85}]",
      "created_at": "2024-01-15T10:30:05Z"
    }
  ]
}
```

### Send Message

Send a message and get AI response.

```http
POST /chat/send
```

**Request Body:**
```json
{
  "message": "What is the summary of my documents?",
  "chat_id": 1
}
```

Note: If `chat_id` is null, a new chat will be created.

**Response (200 OK):**
```json
{
  "user_message": {
    "id": 3,
    "chat_id": 1,
    "role": "user",
    "content": "What is the summary of my documents?",
    "sources": null,
    "created_at": "2024-01-15T11:00:00Z"
  },
  "assistant_message": {
    "id": 4,
    "chat_id": 1,
    "role": "assistant",
    "content": "Here's a summary of your documents...",
    "sources": "[{\"filename\": \"report.pdf\", \"relevance\": 0.92}]",
    "created_at": "2024-01-15T11:00:05Z"
  },
  "chat_id": 1,
  "sources": [
    {
      "filename": "report.pdf",
      "relevance": 0.92,
      "chunk_preview": "The quarterly report shows..."
    }
  ]
}
```

### Delete Chat

Delete a chat and all its messages.

```http
DELETE /chat/{chat_id}
```

**Response (200 OK):**
```json
{
  "message": "Chat deleted successfully"
}
```

---

## Document Endpoints

### Upload Documents

Upload one or more documents for processing.

```http
POST /documents/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `files` (File[]) - Files to upload

**Supported Formats:** PDF, DOCX, XLSX, PPTX, TXT, MD, CSV, PNG, JPG, JPEG, GIF, BMP, TIFF

**Response (200 OK):**
```json
{
  "message": "Uploaded 2 file(s) for processing",
  "documents": [
    {
      "id": 1,
      "filename": "report_a1b2c3d4.pdf",
      "original_filename": "report.pdf",
      "file_type": "pdf",
      "file_size": 1024000,
      "status": "pending",
      "chunk_count": 0,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "success_count": 2,
  "failed_count": 0
}
```

### List Documents

Get all documents for the current user.

```http
GET /documents/
```

**Query Parameters:**
- `page` (int, default: 1)
- `per_page` (int, default: 20)
- `status_filter` (string, optional) - Filter by status

**Response (200 OK):**
```json
{
  "documents": [...],
  "total": 10,
  "page": 1,
  "per_page": 20
}
```

### Get Document

Get a specific document.

```http
GET /documents/{document_id}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "filename": "report_a1b2c3d4.pdf",
  "original_filename": "report.pdf",
  "file_type": "pdf",
  "file_size": 1024000,
  "status": "completed",
  "chunk_count": 15,
  "created_at": "2024-01-15T10:30:00Z",
  "processed_at": "2024-01-15T10:31:00Z"
}
```

### Delete Document

Delete a document.

```http
DELETE /documents/{document_id}
```

**Response (200 OK):**
```json
{
  "message": "Document deleted successfully",
  "deleted_id": 1
}
```

### Reprocess Document

Reprocess a failed document.

```http
POST /documents/{document_id}/reprocess
```

**Response (200 OK):**
```json
{
  "message": "Document queued for reprocessing"
}
```

---

## History Endpoints

### Get Overview

Get statistics and recent activity.

```http
GET /history/overview
```

**Response (200 OK):**
```json
{
  "statistics": {
    "total_chats": 25,
    "total_messages": 150,
    "total_documents": 10,
    "completed_documents": 8,
    "recent_chats": 5,
    "recent_documents": 2
  },
  "recent_chats": [...],
  "recent_documents": [...]
}
```

### Get Chat History

Get paginated chat history with filtering.

```http
GET /history/chats
```

**Query Parameters:**
- `page` (int, default: 1)
- `per_page` (int, default: 20)
- `search` (string, optional)
- `date_from` (datetime, optional)
- `date_to` (datetime, optional)

### Get Document History

Get paginated document history with filtering.

```http
GET /history/documents
```

**Query Parameters:**
- `page` (int, default: 1)
- `per_page` (int, default: 20)
- `search` (string, optional)
- `status` (string, optional)
- `file_type` (string, optional)

### Get Activity Timeline

Get activity data for charts.

```http
GET /history/activity
```

**Query Parameters:**
- `days` (int, default: 7, max: 30)

**Response (200 OK):**
```json
{
  "timeline": [
    {
      "date": "2024-01-15",
      "chats": 3,
      "documents": 1
    }
  ],
  "period": {
    "start": "2024-01-08T00:00:00Z",
    "end": "2024-01-15T12:00:00Z",
    "days": 7
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request body"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "An internal error occurred"
}
```
