---
description: How to run the RAG Chatbot application locally
---

# Running the RAG Chatbot Application

## Prerequisites
- Python 3.10+
- Node.js 18+
- Gemini API Key

## Backend Setup

// turbo
1. Navigate to the backend directory:
```bash
cd backend
```

// turbo
2. Create a virtual environment:
```bash
python -m venv venv
```

// turbo
3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

// turbo
4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file with your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

// turbo
6. Run the backend server:
```bash
python main.py
```

The backend will start on http://localhost:8000

## Frontend Setup

// turbo
1. Navigate to the frontend directory:
```bash
cd frontend
```

// turbo
2. Install dependencies:
```bash
npm install
```

// turbo
3. Start the development server:
```bash
npm run dev
```

The frontend will start on http://localhost:5173

## Running with Docker (Alternative)

// turbo-all

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

The application will be available at http://localhost:3000
