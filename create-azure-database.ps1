# Create database on Azure PostgreSQL
Write-Host "Creating database on Azure PostgreSQL..." -ForegroundColor Cyan

$env:PGPASSWORD = "AB@!24`$%"

psql -h nmslwebportaltestdb.postgres.database.azure.com `
     -U nmslwebportaltestdb `
     -d postgres `
     -c "CREATE DATABASE \"nmsl-website-portal\";"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    Write-Host "Try creating manually via Azure Portal or use 'postgres' database" -ForegroundColor Yellow
}

Remove-Item Env:\PGPASSWORD
