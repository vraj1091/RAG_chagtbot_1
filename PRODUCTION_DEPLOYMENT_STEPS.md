# Production Deployment Checklist

## Current Status (as of Feb 11, 2026)

### URLs:
- **Frontend**: https://rag-chatbot-frontend-1cx3.onrender.com
- **Backend**: https://rag-chatbot-api-ljjp.onrender.com
- **Backend Health**: https://rag-chatbot-api-ljjp.onrender.com/health

### Latest Commits Pushed:
1. ✅ Backend URL fixed (ljjp)
2. ✅ CORS configured for all origins
3. ✅ Chat title generation bug fixed
4. ✅ Improved error handling

---

## IMMEDIATE ACTION REQUIRED:

### Step 1: Check Backend Deployment (DO THIS NOW!)

1. **Open Render Dashboard**: https://dashboard.render.com
2. **Find service**: `rag-chatbot-api`
3. **Check Status**:
   - If "Live" → Click into it and check the deployment time
   - If "Deploy failed" → Click "Manual Deploy" → "Clear build cache & deploy"
   - If "Deploying" → Wait for it to finish (8-10 minutes)

### Step 2: Verify Backend is Running

Open this URL in your browser:
```
https://rag-chatbot-api-ljjp.onrender.com/health
```

**Expected Response:**
```json
{"status":"healthy"}
```

**If you get 404 or error:** Backend is not running properly!

### Step 3: Check Backend Logs

In Render dashboard → `rag-chatbot-api` → "Logs" tab

**Look for these messages:**
- ✅ GOOD: "✓ Gemini API configured successfully with gemini-1.5-flash"
- ❌ BAD: "Failed to import google.generativeai"
- ❌ BAD: "Gemini API key not configured"

### Step 4: Force Manual Redeploy

If the backend is Live but still showing old code:

1. Go to `rag-chatbot-api` in Render dashboard
2. Click **"Manual Deploy"** (top right)
3. Select **"Clear build cache & deploy"**
4. Wait 8-10 minutes
5. Check logs for success messages

### Step 5: Test Production Chat

Once backend shows "✓ Gemini API configured successfully":

1. Open: https://rag-chatbot-frontend-1cx3.onrender.com/chat
2. **Hard refresh**: Ctrl + Shift + R
3. Type a message
4. It should work!

---

## If Backend Keeps Failing:

### Check Environment Variables in Render:

1. Go to `rag-chatbot-api` → "Environment" tab
2. Verify these are set:
   - `GEMINI_API_KEY` = AIzaSyAho7DUvDVWPeZSKnnRTk1eUUgEbpGvhWM
   - `DEBUG` = false
   - `SECRET_KEY` = (should be auto-generated)

3. If `GEMINI_API_KEY` is missing → Add it manually

### Check Build Logs:

If deployment fails, check the build logs for:
- ❌ "Failed to install google-generativeai"
- ❌ Python version mismatch
- ❌ Out of memory (free tier limitation)

---

## Expected Timeline:

- **Backend redeploy**: 8-10 minutes
- **Frontend picks up changes**: Automatic (1-2 minutes after backend is live)
- **Total time**: ~12 minutes from manual deploy

---

## Current Files Status:

All fixes are committed and pushed to GitHub:
- ✅ frontend/src/services/api.js → Correct backend URL (ljjp)
- ✅ backend/main.py → Aggressive CORS configuration
- ✅ backend/app/services/rag_service.py → Bug fixes + better errors
- ✅ backend/app/api/chat.py → Improved error logging

**Everything is ready in the code - just needs to be deployed on Render!**

---

## DO THIS NOW:

1. **Open**: https://dashboard.render.com/web/srv-d65ihfvpm1nc739r8rk0
2. **Click**: "Manual Deploy" → "Clear build cache & deploy"
3. **Wait**: 8-10 minutes
4. **Test**: https://rag-chatbot-frontend-1cx3.onrender.com/chat

**After this manual deploy, your production chat will work!** 🚀
