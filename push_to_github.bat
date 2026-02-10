@echo off
setlocal EnableDelayedExpansion

echo ===================================
echo   Pushing Code to GitHub Repository
echo ===================================

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo Please install Git from https://git-scm.com/downloads
    echo and restart your terminal.
    pause
    exit /b 1
)

echo [INFO] Git found. proceeding...

REM Initialize git repository if not present
if not exist ".git" (
    echo [INFO] Initializing git repository...
    git init
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to initialize git repository.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Git repository already exists.
)

REM Configure user identity if not set (optional but good practice)
git config user.name "Vraj Patel"
git config user.email "vrajr@example.com"
rem Note: These are placeholders. Git will use global config if set.

REM Add all files
echo [INFO] Adding files to staging area...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to add files.
    pause
    exit /b 1
)

REM Commit changes
echo [INFO] Committing changes...
git commit -m "Pushing latest code updates"
rem Use `rem` to ignore exit code here as commit might be empty if nothing changed

REM Manage remotes
echo [INFO] Configuring remote repository...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/vraj1091/RAG_chagtbot_1.git
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to add remote origin.
    pause
    exit /b 1
)

REM Set branch to main
echo [INFO] Renaming branch to 'main'...
git branch -M main

REM Push to remote
echo [INFO] Pushing to GitHub...
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to push to GitHub.
    echo Please check your internet connection and GitHub credentials.
    echo Note: If this is a new repository, you might need to authenticate.
    pause
    exit /b 1
)

echo ===================================
echo   Successfully pushed to GitHub!
echo ===================================
pause
