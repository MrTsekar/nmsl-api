# Enable UUID Extension for Azure PostgreSQL
# Run this to enable uuid-ossp extension

Write-Host "🔧 Enabling UUID Extension for Azure PostgreSQL" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$resourceGroup = Read-Host "Enter your Azure Resource Group name"
$serverName = "nmslwebportaltestdb"
$dbName = "nmsl-website-portal"

Write-Host ""
Write-Host "Enabling uuid-ossp extension..." -ForegroundColor Yellow

# Enable the extension
az postgres server configuration set `
    --resource-group $resourceGroup `
    --server-name $serverName `
    --name azure.extensions `
    --value uuid-ossp

Write-Host ""
Write-Host "✅ Extension enabled!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Now run migrations:" -ForegroundColor Cyan
Write-Host "   npm run migration:run"
