#!/usr/bin/env bash
# Build script for Render deployment
# Installs core dependencies first, then tries optional heavy ones

set -e

echo "=== Installing core dependencies ==="
pip install --no-cache-dir -r requirements.txt

echo "=== Trying optional heavy dependencies ==="
# These may fail on free tier due to memory limits - that's OK
pip install --no-cache-dir numpy"<2.0" 2>/dev/null || echo "WARNING: numpy install failed (optional)"
pip install --no-cache-dir chromadb==0.4.22 2>/dev/null || echo "WARNING: chromadb install failed (optional - document search disabled)"
pip install --no-cache-dir sentence-transformers==2.3.1 2>/dev/null || echo "WARNING: sentence-transformers install failed (optional - document search disabled)"
pip install --no-cache-dir pytesseract==0.3.10 2>/dev/null || echo "WARNING: pytesseract install failed (optional - OCR disabled)"
pip install --no-cache-dir pdf2image==1.17.0 2>/dev/null || echo "WARNING: pdf2image install failed (optional - PDF OCR disabled)"

echo "=== Build complete ==="
echo "Core API (auth, chat, documents) will work."
echo "Document search features depend on optional packages above."
