# 🤖 RAG Chatbot with Gemini API

A powerful Retrieval-Augmented Generation (RAG) chatbot that leverages Google's Gemini API to provide intelligent responses based on uploaded documents and general conversation.

![RAG Chatbot](https://img.shields.io/badge/RAG-Chatbot-blue)
![Python](https://img.shields.io/badge/Python-3.10+-green)
![React](https://img.shields.io/badge/React-18+-61DAFB)
![Gemini](https://img.shields.io/badge/Gemini-API-4285F4)

## ✨ Features

### 🧠 Intelligent Chat
- **Context-Aware Responses**: Answers questions based on uploaded documents
- **General Conversation**: Handles regular chat when no documents are relevant
- **Multi-turn Conversations**: Maintains chat history for coherent discussions

### 📁 Multi-Format Document Support
- **Text Files**: `.txt`, `.md`, `.csv`
- **PDF Documents**: With text extraction and OCR support
- **Microsoft Office**: `.docx`, `.xlsx`, `.pptx`
- **Images with OCR**: `.png`, `.jpg`, `.jpeg`, `.bmp`, `.gif`, `.tiff`
- **Batch Upload**: Upload multiple files simultaneously

### 🎨 Modern Dashboard
- **Chat Interface**: Clean, responsive chat experience
- **Document Upload**: Drag-and-drop file upload with progress tracking
- **History Overview**: View chat and upload history

### 🔐 User Management
- **Secure Authentication**: JWT-based login/registration
- **SQLite Database**: Secure local data storage
- **Session Management**: Persistent user sessions

### 🚀 Easy Deployment
- **Render Blueprint**: One-click deployment
- **Docker Support**: Containerized deployment
- **Manual Setup**: Traditional deployment option

## 📋 Prerequisites

- Python 3.10+
- Node.js 18+
- Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

## 🛠️ Installation

### Quick Start (Docker)

```bash
# Clone the repository
git clone <your-repo-url>
cd RAG_CHATBOT

# Create .env file
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Run with Docker Compose
docker-compose up --build
```

### Manual Installation

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and add your API keys
cp .env.example .env

# Run the server
python main.py
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌐 Deployment on Render

### Blueprint Deployment (Recommended)

1. Fork this repository
2. Create a new Render account if you don't have one
3. Click "New" → "Blueprint"
4. Connect your forked repository
5. Add environment variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `SECRET_KEY`: A random secret key for JWT
6. Deploy!

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed manual deployment instructions.

## 📖 Usage

### Chat Interface
1. Log in or register a new account
2. Navigate to the Chat page
3. Type your message and press Enter or click Send
4. The AI will respond based on your uploaded documents or general knowledge

### Document Upload
1. Navigate to the Upload page
2. Drag and drop files or click to browse
3. Supported formats: TXT, PDF, DOCX, XLSX, PNG, JPG, etc.
4. Wait for processing to complete
5. Documents are now searchable in your chats

### History
1. Navigate to the History page
2. View past chat conversations
3. View uploaded document history
4. Search and filter history items

## 🏗️ Architecture

```
RAG_CHATBOT/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configurations
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── main.py             # Application entry
│   └── requirements.txt    # Python dependencies
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── styles/         # CSS styles
│   └── package.json        # Node dependencies
├── docker-compose.yml      # Docker composition
├── render.yaml             # Render blueprint
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `SECRET_KEY` | JWT secret key | Yes |
| `DATABASE_URL` | SQLite database path | No (default: `./data/rag_chatbot.db`) |
| `CORS_ORIGINS` | Allowed CORS origins | No (default: `*`) |

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [LangChain](https://langchain.com/)
