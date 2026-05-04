# Azure Storage CORS Configuration Script
# This fixes the 403 Forbidden error for direct browser uploads to Azure Blob Storage

# Prerequisites:
#   1. Install Azure CLI: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
#   2. Login:  az login

$STORAGE_ACCOUNT = "nmslwebportaltestblob"

Write-Host "Configuring CORS for Azure Storage Account: $STORAGE_ACCOUNT" -ForegroundColor Cyan

# Clear existing CORS first to avoid duplicates
az storage cors clear --services b --account-name $STORAGE_ACCOUNT

# Configure CORS for Blob Service
az storage cors add `
  --services b `
  --methods GET PUT POST DELETE OPTIONS HEAD `
  --origins "https://nmsl-portal1.vercel.app" "https://nmsl-portal-2jrw.vercel.app" "https://www.nmsl.ng" "https://nmsl.ng" "http://localhost:3000" "http://localhost:3001" "http://localhost:5173" `
  --allowed-headers "*" `
  --exposed-headers "*" `
  --max-age 3600 `
  --account-name $STORAGE_ACCOUNT

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK CORS configured successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test your upload again - it should work now!" -ForegroundColor Green
} else {
    Write-Host "FAILED to configure CORS via CLI" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure manually in Azure Portal:" -ForegroundColor Yellow
    Write-Host "  1. https://portal.azure.com -> Storage Accounts -> $STORAGE_ACCOUNT"
    Write-Host "  2. Settings -> Resource sharing (CORS) -> Blob service tab"
    Write-Host "  3. Add a row:"
    Write-Host "       Allowed origins: https://nmsl-portal1.vercel.app, https://www.nmsl.ng, http://localhost:3000"
    Write-Host "       Allowed methods: GET,PUT,POST,DELETE,OPTIONS,HEAD"
    Write-Host "       Allowed headers: *"
    Write-Host "       Exposed headers: *"
    Write-Host "       Max age: 3600"
    Write-Host "  4. Save"
}
