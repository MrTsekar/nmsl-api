# Azure PostgreSQL Firewall Configuration for Render
# This script helps you configure Azure PostgreSQL to allow connections from Render

Write-Host "🔧 Azure PostgreSQL Firewall Fix for Render" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$serverName = "nmslwebportaltestdb"
$resourceGroup = Read-Host "Enter your Azure Resource Group name"

Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "1. Allow all Azure services (recommended for Azure-hosted apps)"
Write-Host "2. Allow all IPs temporarily (0.0.0.0-255.255.255.255) - for testing"
Write-Host "3. Add specific IP range for Render"
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "Allowing all Azure services..." -ForegroundColor Green
        az postgres server firewall-rule create `
            --resource-group $resourceGroup `
            --server-name $serverName `
            --name "AllowAllAzureServices" `
            --start-ip-address 0.0.0.0 `
            --end-ip-address 0.0.0.0
    }
    "2" {
        Write-Host "⚠️  WARNING: This allows ALL IPs - only for testing!" -ForegroundColor Yellow
        az postgres server firewall-rule create `
            --resource-group $resourceGroup `
            --server-name $serverName `
            --name "AllowAllIPs-TEMP" `
            --start-ip-address 0.0.0.0 `
            --end-ip-address 255.255.255.255
    }
    "3" {
        Write-Host "Note: Render uses dynamic IPs. You may need to allow all IPs or use Azure services." -ForegroundColor Yellow
        $startIp = Read-Host "Enter start IP address"
        $endIp = Read-Host "Enter end IP address"
        az postgres server firewall-rule create `
            --resource-group $resourceGroup `
            --server-name $serverName `
            --name "RenderIPRange" `
            --start-ip-address $startIp `
            --end-ip-address $endIp
    }
}

Write-Host ""
Write-Host "✅ Firewall rule created!" -ForegroundColor Green
Write-Host ""
Write-Host "Current firewall rules:" -ForegroundColor Cyan
az postgres server firewall-rule list `
    --resource-group $resourceGroup `
    --server-name $serverName `
    --output table

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Redeploy your Render service"
Write-Host "2. Check the logs for database connection"
Write-Host "3. If still failing, try option 2 (allow all IPs) temporarily"
