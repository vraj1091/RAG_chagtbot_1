# Fix Production Deployment on Render

## Issue
Your frontend at `https://rag-chatbot-frontend-1o3.onrender.com` is getting 404 errors when trying to access the backend API at `https://rag-chatbot-api-1jjn.onrender.com/api/auth/login`.

## Root Cause
The backend service on Render is either:
1. Not deployed
2. Not running
3. Has a different URL than expected

## Solution Steps

### Option 1: Redeploy Backend to Render

1. **Login to Render Dashboard**
   - Go to https://dashboard.render.com
   - Find your `rag-chatbot-api` service

2. **Check Backend Status**
   - Click on the `rag-chatbot-api` service
   - Check if it shows "Live" or "Failed"
   - Look at the logs for any errors

3. **Manual Redeploy**
   - Click "Manual Deploy" > "Deploy latest commit"
   - Wait for the build to complete
   - Check logs for any errors

4. **Verify Backend URL**
   - Once deployed, copy the actual URL of your backend
   - It should be something like: `https://rag-chatbot-api-XXXX.onrender.com`

5. **Update Frontend Configuration**
   - Update `frontend/src/services/api.js` line 7 with the correct backend URL
   - Update `render.yaml` lines 50 and 58 with the correct backend URL
   - Commit and push changes to trigger a redeploy

### Option 2: Deploy Using Blueprint

1. **Delete Existing Services** (if needed)
   - Go to Render dashboard
   - Delete `rag-chatbot-api` and `rag-chatbot-frontend` services

2. **Create New Blueprint**
   - Click "New" > "Blueprint"
   - Connect your GitHub repository
   - Select the branch (usually `main`)
   - Render will read `render.yaml` and create both services

3. **Set Environment Variables**
   - For `rag-chatbot-api` service:
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `SECRET_KEY`: Auto-generated (should be set automatically)
     - Other variables are set in `render.yaml`

4. **Wait for Deployment**
   - Backend will take 5-10 minutes (installing dependencies)
   - Frontend will take 2-3 minutes

5. **Update URLs**
   - Once both services are deployed, note their URLs
   - Update `frontend/src/services/api.js` if the backend URL changed
   - Update `render.yaml` if URLs changed

## Verify Deployment

### Test Backend API
```bash
curl https://your-backend-url.onrender.com/health
```
Should return: `{"status":"healthy"}`

### Test Login Endpoint
```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```
Should return: `{"detail":"Incorrect email or password"}` (which is correct for non-existent user)

### Test Frontend
- Open `https://your-frontend-url.onrender.com/login`
- Try to register a new account
- Then login with that account

## Important Notes

1. **Free Tier Limitations**
   - Render free tier services spin down after 15 minutes of inactivity
   - First request after spindown takes 30-60 seconds to wake up
   - This is normal for free tier

2. **Environment Variables**
   - Make sure `GEMINI_API_KEY` is set in Render dashboard
   - Without it, the AI features won't work

3. **CORS Settings**
   - I've already updated CORS to include your new frontend URL
   - If you change URLs again, update:
     - `backend/app/core/config.py` line 23
     - `render.yaml` line 24

4. **Database**
   - Using SQLite (file-based)
   - Data persists on Render's disk
   - On free tier, data may be lost if service is deleted

## Files I Modified

1. `backend/app/core/config.py` - Updated CORS origins
2. `render.yaml` - Updated CORS origins
3. `frontend/src/services/api.js` - Changed to use localhost for local dev

## Need More Help?

If the backend still doesn't work after redeploying:
1. Check Render logs for the backend service
2. Look for any error messages during build or startup
3. Verify all environment variables are set correctly
4. Check if the service URL matches what's configured in the frontend
