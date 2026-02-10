# Troubleshooting Guide

This guide helps you resolve common issues with the RAG Chatbot application.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [API Key Issues](#api-key-issues)
3. [Document Processing Issues](#document-processing-issues)
4. [Chat Issues](#chat-issues)
5. [Authentication Issues](#authentication-issues)
6. [Performance Issues](#performance-issues)
7. [Deployment Issues](#deployment-issues)

---

## Installation Issues

### Python Dependencies Fail to Install

**Problem:** `pip install -r requirements.txt` fails with compilation errors.

**Solutions:**

1. **Install build tools (Windows):**
   ```bash
   # Install Visual C++ Build Tools
   # Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   ```

2. **Install build tools (Linux):**
   ```bash
   sudo apt install build-essential python3-dev
   ```

3. **Use pre-built wheels:**
   ```bash
   pip install --upgrade pip wheel
   pip install -r requirements.txt
   ```

### Node.js Dependencies Fail

**Problem:** `npm install` fails or takes too long.

**Solutions:**

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use a different registry:**
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```

---

## API Key Issues

### "GEMINI_API_KEY not configured"

**Problem:** The application cannot find the Gemini API key.

**Solutions:**

1. **Check .env file:**
   ```bash
   # Ensure .env exists and contains:
   GEMINI_API_KEY=your_actual_api_key
   ```

2. **Verify environment variable is loaded:**
   ```python
   # In Python shell:
   import os
   print(os.getenv('GEMINI_API_KEY'))
   ```

3. **For Docker:**
   ```bash
   # Pass as environment variable
   docker-compose up -e GEMINI_API_KEY=your_key
   ```

### "API key not valid"

**Problem:** The Gemini API rejects the key.

**Solutions:**

1. **Verify key at Google AI Studio:**
   - Visit https://makersuite.google.com/app/apikey
   - Check if the key is active
   - Generate a new key if needed

2. **Check for trailing spaces:**
   ```bash
   # Remove any whitespace from the key
   GEMINI_API_KEY=AIzaSy...your_key_here
   ```

3. **Check API quotas:**
   - Free tier has limited requests
   - Check usage at Google Cloud Console

---

## Document Processing Issues

### Documents Stuck on "Processing"

**Problem:** Documents remain in "processing" status indefinitely.

**Solutions:**

1. **Check background tasks:**
   ```bash
   # View backend logs
   docker-compose logs backend
   ```

2. **Restart the backend:**
   ```bash
   docker-compose restart backend
   ```

3. **Check file permissions:**
   ```bash
   # Ensure uploads directory is writable
   chmod 755 backend/uploads
   chmod 755 backend/data
   ```

### "No text extracted from document"

**Problem:** Document processing completes but extracts no text.

**Solutions:**

1. **For PDF files:**
   - Ensure the PDF contains actual text, not just images
   - For image-based PDFs, OCR will be used (slower)
   
2. **Install OCR dependencies:**
   ```bash
   # Linux
   sudo apt install tesseract-ocr tesseract-ocr-eng poppler-utils
   
   # Windows
   # Install Tesseract from https://github.com/UB-Mannheim/tesseract/wiki
   # Add to PATH
   ```

3. **Check Tesseract installation:**
   ```bash
   tesseract --version
   ```

### "File type not supported"

**Problem:** Cannot upload certain file types.

**Supported formats:**
- Text: `.txt`, `.md`, `.csv`
- PDF: `.pdf`
- Word: `.docx`, `.doc`
- Excel: `.xlsx`, `.xls`
- PowerPoint: `.pptx`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`

---

## Chat Issues

### "Failed to send message"

**Problem:** Messages fail to send or get no response.

**Solutions:**

1. **Check API connectivity:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check Gemini API status:**
   - Visit https://status.cloud.google.com/

3. **View error details:**
   - Open browser developer console (F12)
   - Check Network tab for failed requests

### Responses Don't Reference Documents

**Problem:** AI answers don't use uploaded document content.

**Solutions:**

1. **Verify documents are processed:**
   - Go to Upload page
   - Check status is "Completed"
   - Check chunk count is > 0

2. **Ask more specific questions:**
   - Include keywords from your documents
   - Ask "Based on my uploaded documents, ..."

3. **Check relevance threshold:**
   - Default threshold is 0.3
   - Very general questions may not match documents

---

## Authentication Issues

### "Could not validate credentials"

**Problem:** JWT token is invalid or expired.

**Solutions:**

1. **Clear browser storage and re-login:**
   - Open Developer Tools → Application → Local Storage
   - Delete `auth-storage`
   - Refresh and login again

2. **Check SECRET_KEY consistency:**
   - If SECRET_KEY changes, all tokens become invalid
   - Use a fixed SECRET_KEY in production

### "Email already registered"

**Problem:** Cannot register with an email that's already in use.

**Solutions:**

1. **Use password reset (if implemented)**

2. **Clear database (development only):**
   ```bash
   rm backend/data/rag_chatbot.db
   # Restart backend to recreate
   ```

---

## Performance Issues

### Slow Document Processing

**Problem:** Large documents take too long to process.

**Solutions:**

1. **Increase chunk size:**
   - Edit `vector_store.py`
   - Increase `chunk_size` parameter

2. **Use async processing:**
   - Documents process in background
   - Check status periodically

3. **Optimize for production:**
   ```env
   DEBUG=false
   ```

### High Memory Usage

**Problem:** Application uses too much RAM.

**Solutions:**

1. **Limit concurrent uploads:**
   - Upload fewer files at once

2. **Restart periodically:**
   - For Docker: Add healthcheck restart policy

3. **Use smaller embedding model:**
   - Current: `all-MiniLM-L6-v2` (lightweight)

---

## Deployment Issues

### Render Deployment Fails

**Problem:** Build or deployment fails on Render.

**Solutions:**

1. **Check build logs:**
   - Render Dashboard → Service → Logs

2. **Verify Python version:**
   ```
   # In render.yaml or dashboard
   PYTHON_VERSION=3.11.0
   ```

3. **Check disk space:**
   - Ensure disk is attached for `/app/data`

### CORS Errors

**Problem:** Frontend cannot connect to backend.

**Solutions:**

1. **Update CORS_ORIGINS:**
   ```env
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   ```

2. **For development:**
   ```env
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

### Static Files Not Loading

**Problem:** Frontend shows blank page or missing styles.

**Solutions:**

1. **Check build output:**
   ```bash
   cd frontend
   npm run build
   ls -la dist/
   ```

2. **Verify publish path:**
   - Render static sites: `dist`
   - Check `staticPublishPath` in render.yaml

---

## Getting More Help

If you're still experiencing issues:

1. **Check application logs:**
   ```bash
   # Docker
   docker-compose logs -f
   
   # Render
   # Dashboard → Service → Logs
   ```

2. **Enable debug mode (development only):**
   ```env
   DEBUG=true
   ```

3. **Create a GitHub Issue with:**
   - Error message
   - Steps to reproduce
   - Environment (OS, Python version, Node version)
   - Relevant logs (sanitize API keys!)
