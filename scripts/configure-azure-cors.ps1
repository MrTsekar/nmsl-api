# Azure Storage CORS Configuration Script
# This fixes the 403 Forbidden error for direct uploads

# Prerequisites: Install Azure CLI and login
# Install: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
# Login: az login

$STORAGE_ACCOUNT = "nmslstorage"
$RESOURCE_GROUP = "your-resource-group-name"  # Replace with your resource group

Write-Host "Configuring CORS for Azure Storage Account: $STORAGE_ACCOUNT" -ForegroundColor Cyan

# Configure CORS for Blob Service
az storage cors add `
  --services b `
  --methods GET PUT OPTIONS `
  --origins "https://nmsl-portal-2jrw.vercel.app" "http://localhost:3000" "http://localhost:5173" `
  --allowed-headers "*" `
  --exposed-headers "*" `
  --max-age 3600 `
  --account-name $STORAGE_ACCOUNT

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CORS configured successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration applied:" -ForegroundColor Yellow
    Write-Host "  - Allowed origins: Frontend URLs + localhost for testing"
    Write-Host "  - Allowed methods: GET, PUT, OPTIONS"
    Write-Host "  - Allowed headers: All (*)"
    Write-Host ""
    Write-Host "Test your upload again - it should work now!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure CORS" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please configure manually in Azure Portal:" -ForegroundColor Yellow
    Write-Host "1. Go to Azure Portal → Storage Account → Resource sharing (CORS)"
    Write-Host "2. Add the configuration shown above"
}
