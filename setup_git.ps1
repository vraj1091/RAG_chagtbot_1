$ErrorActionPreference = "Stop"
try {
    Write-Host "Step 1: Init"
    git init
    if ($LASTEXITCODE -ne 0) { throw "git init failed with code $LASTEXITCODE" }
    
    Write-Host "Step 2: Add"
    git add .
    
    Write-Host "Step 3: Commit"
    git commit -m "Initial commit"
    
    Write-Host "Step 4: Remote"
    try { git remote remove origin 2>$null } catch {}
    git remote add origin https://github.com/vraj1091/RAG_chagtbot_1.git
    
    Write-Host "Step 5: Branch"
    git branch -M main
    
    Write-Host "Step 6: Push"
    # This might hang if credentials are needed, so we rely on user environment being set up
    git push -u origin main
} catch {
    Write-Error $_
    exit 1
}
