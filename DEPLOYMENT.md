# Deployment Guide for RAG Chatbot

This guide covers deploying the RAG Chatbot application to Render and other platforms.

## Table of Contents

1. [Render Deployment](#render-deployment)
   - [Blueprint Deployment](#blueprint-deployment-recommended)
   - [Manual Deployment](#manual-deployment)
2. [Docker Deployment](#docker-deployment)
3. [Manual Server Deployment](#manual-server-deployment)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)

---

## Render Deployment

### Blueprint Deployment (Recommended)

This is the easiest way to deploy the application.

1. **Fork the Repository**
   - Fork this repository to your GitHub account

2. **Create Render Account**
   - Go to [render.com](https://render.com) and sign up

3. **Create Blueprint**
   - Click "New" → "Blueprint"
   - Connect your GitHub account
   - Select your forked repository
   - Render will automatically detect the `render.yaml` file

4. **Configure Environment Variables**
   - `GEMINI_API_KEY`: Your Google Gemini API key
     - Get one at: https://makersuite.google.com/app/apikey
   - `SECRET_KEY`: Will be auto-generated

5. **Deploy**
   - Click "Apply" to start the deployment
   - Wait for both services to become healthy (5-10 minutes)

6. **Access Your App**
   - Frontend: `https://rag-chatbot-frontend.onrender.com`
   - API: `https://rag-chatbot-api.onrender.com`

### Manual Deployment

If you prefer manual control over the deployment:

#### Backend Service

1. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect repository
   - Select `backend` as root directory

2. **Configure Settings**
   ```
   Name: rag-chatbot-api
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Add Environment Variables**
   ```
   GEMINI_API_KEY=your_api_key
   SECRET_KEY=your_secret_key
   DATABASE_URL=sqlite:///./data/rag_chatbot.db
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   DEBUG=false
   ```

4. **Add Disk (for persistent data)**
   - Name: `rag-data`
   - Mount Path: `/app/data`
   - Size: 1 GB

#### Frontend Service

1. **Create Static Site**
   - Click "New" → "Static Site"
   - Connect repository
   - Select `frontend` as root directory

2. **Configure Settings**
   ```
   Name: rag-chatbot-frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. **Add Redirect/Rewrite Rules**
   ```
   Source: /api/*
   Destination: https://rag-chatbot-api.onrender.com/api/*
   Type: Rewrite

   Source: /*
   Destination: /index.html
   Type: Rewrite
   ```

---

## Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- Gemini API key

### Steps

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd RAG_CHATBOT
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file**
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   SECRET_KEY=your_super_secret_key
   ```

4. **Build and Run**
   ```bash
   docker-compose up --build -d
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build -d

# View running containers
docker-compose ps
```

---

## Manual Server Deployment

### Prerequisites
- Ubuntu 20.04+ or similar Linux server
- Python 3.10+
- Node.js 18+
- Nginx (for production)

### Backend Setup

```bash
# Install system dependencies
sudo apt update
sudo apt install python3.11 python3.11-venv tesseract-ocr poppler-utils

# Create application directory
mkdir -p /opt/rag-chatbot
cd /opt/rag-chatbot

# Clone repository
git clone <your-repo-url> .

# Setup backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create data directories
mkdir -p data uploads

# Create and configure .env
cp .env.example .env
nano .env  # Add your API keys

# Test run
python main.py
```

### Frontend Setup

```bash
cd /opt/rag-chatbot/frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /opt/rag-chatbot/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 50M;
    }
}
```

### Systemd Service (for backend)

Create `/etc/systemd/system/rag-chatbot.service`:

```ini
[Unit]
Description=RAG Chatbot Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/rag-chatbot/backend
Environment="PATH=/opt/rag-chatbot/backend/venv/bin"
ExecStart=/opt/rag-chatbot/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable rag-chatbot
sudo systemctl start rag-chatbot
```

---

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `SECRET_KEY` | JWT signing secret | Yes | - |
| `DATABASE_URL` | SQLite database path | No | `sqlite:///./data/rag_chatbot.db` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | No | `*` |
| `DEBUG` | Enable debug mode | No | `false` |
| `HOST` | Server host | No | `0.0.0.0` |
| `PORT` | Server port | No | `8000` |
| `MAX_FILE_SIZE_MB` | Maximum upload file size | No | `50` |

---

## Troubleshooting

### Common Issues

#### 1. "GEMINI_API_KEY not configured"
- Ensure `GEMINI_API_KEY` environment variable is set
- Verify the API key is valid at https://makersuite.google.com/

#### 2. "Connection refused" on API calls
- Check backend is running: `curl http://localhost:8000/health`
- Verify CORS_ORIGINS includes your frontend URL
- Check firewall rules

#### 3. File uploads failing
- Verify `uploads` directory exists and is writable
- Check `MAX_FILE_SIZE_MB` configuration
- Ensure Nginx/proxy allows large uploads (`client_max_body_size`)

#### 4. OCR not working
- Install Tesseract: `apt install tesseract-ocr`
- For Windows: Install Tesseract and add to PATH
- Verify installation: `tesseract --version`

#### 5. Database errors
- Ensure `data` directory exists and is writable
- Check `DATABASE_URL` path is correct
- Try deleting `data/rag_chatbot.db` to reset

### Getting Help

1. Check the logs:
   - Backend: `docker-compose logs backend` or check systemd journal
   - Frontend: Browser developer console

2. API Documentation: Visit `/docs` on your backend URL

3. Create an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details
