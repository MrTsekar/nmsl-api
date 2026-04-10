# Pre-Push Git Hook Setup Script
# This script installs the pre-push hook that validates code before pushing

Write-Host ""
Write-Host "Setting up Git pre-push hook..." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Gray

$hookSource = ".githooks/pre-push"
$hookDest = ".git/hooks/pre-push"

# Check if source hook exists
if (-not (Test-Path $hookSource)) {
    Write-Host "Error: Hook source file not found at $hookSource" -ForegroundColor Red
    exit 1
}

# Create hooks directory if it doesn't exist
$hooksDir = ".git/hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

# Copy the hook
Write-Host "Copying pre-push hook to .git/hooks/..." -ForegroundColor Yellow
Copy-Item -Path $hookSource -Destination $hookDest -Force

# Make it executable (for Git Bash on Windows)
if ($IsWindows -or $env:OS -like "*Windows*") {
    Write-Host "Pre-push hook installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The hook will run automatically before every push." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "What it does:" -ForegroundColor White
    Write-Host "  1. Stashes uncommitted changes" -ForegroundColor Gray
    Write-Host "  2. Pulls latest from origin/master" -ForegroundColor Gray
    Write-Host "  3. Builds the project (npm run build)" -ForegroundColor Gray
    Write-Host "  4. Restores stashed changes" -ForegroundColor Gray
    Write-Host "  5. Allows push only if build succeeds" -ForegroundColor Gray
} else {
    # On Unix-like systems, make executable
    chmod +x $hookDest
    Write-Host "Pre-push hook installed and made executable!" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""
