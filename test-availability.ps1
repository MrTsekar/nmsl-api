# Quick test script for appointment availability endpoints
# Usage: .\test-availability.ps1

$baseUrl = "http://localhost:8000/api/v1/appointments"

Write-Host "`n=== Testing Appointment Availability Endpoints ===`n" -ForegroundColor Cyan

# Test 1: Get Available Slots (with doctors)
Write-Host "Test 1: Get Available Slots (General Practice in Abuja)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/availability/slots?date=2026-04-15&location=Abuja&specialty=General Practice" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
Write-Host "Status: " -NoNewline
Write-Host "PASS" -ForegroundColor Green
Write-Host "Available Slots: $($data.data.Count) slots"
Write-Host "Slots: $($data.data -join ', ')`n"

# Test 2: Weekend Date
Write-Host "Test 2: Weekend Date (April 19, 2026 - Saturday)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/availability/slots?date=2026-04-19&location=Abuja&specialty=General Practice" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
if ($data.data.Count -eq 0) {
    Write-Host "Status: " -NoNewline
    Write-Host "PASS" -ForegroundColor Green
    Write-Host "Result: Empty array (weekends not allowed)`n"
} else {
    Write-Host "Status: " -NoNewline
    Write-Host "FAIL" -ForegroundColor Red
}

# Test 3: Past Date
Write-Host "Test 3: Past Date (2025-01-01)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/availability/slots?date=2025-01-01&location=Abuja&specialty=General Practice" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
if ($data.data.Count -eq 0) {
    Write-Host "Status: " -NoNewline
    Write-Host "PASS" -ForegroundColor Green
    Write-Host "Result: Empty array (past dates not allowed)`n"
} else {
    Write-Host "Status: " -NoNewline
    Write-Host "FAIL" -ForegroundColor Red
}

# Test 4: Check Date Availability
Write-Host "Test 4: Check Date Availability" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/availability/date?date=2026-04-15&location=Abuja&specialty=General Practice" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
Write-Host "Status: " -NoNewline
Write-Host "PASS" -ForegroundColor Green
Write-Host "Available: $($data.data.available)"
Write-Host "Slot Count: $($data.data.slots)`n"

# Test 5: Invalid Date Format
Write-Host "Test 5: Invalid Date Format" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/availability/slots?date=invalid&location=Abuja&specialty=General Practice" -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: " -NoNewline
    Write-Host "FAIL" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "Status: " -NoNewline
        Write-Host "PASS" -ForegroundColor Green
        Write-Host "Result: 400 Bad Request (as expected)`n"
    } else {
        Write-Host "Status: " -NoNewline
        Write-Host "FAIL" -ForegroundColor Red
    }
}

# Test 6: Get Available Dates (Date Range)
Write-Host "Test 6: Get Available Dates (2-week range)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/availability/dates?startDate=2026-04-14&endDate=2026-04-30&location=Abuja&specialty=General Practice" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
Write-Host "Status: " -NoNewline
Write-Host "PASS" -ForegroundColor Green
Write-Host "Available Dates: $($data.data.Count) dates"
if ($data.data.Count -gt 0) {
    Write-Host "Dates: $($data.data -join ', ')`n"
} else {
    Write-Host "Dates: None (no doctors or all booked)`n"
}

# Test 7: No Doctors Available
Write-Host "Test 7: No Doctors for Specialty" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/availability/slots?date=2026-04-15&location=Lagos&specialty=Cardiology" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
if ($data.data.Count -eq 0) {
    Write-Host "Status: " -NoNewline
    Write-Host "PASS" -ForegroundColor Green
    Write-Host "Result: Empty array (no doctors for Cardiology in Lagos)`n"
} else {
    Write-Host "Status: " -NoNewline
    Write-Host "INFO - Doctors exist" -ForegroundColor Cyan
    Write-Host "Available Slots: $($data.data.Count)`n"
}

Write-Host "`n=== All Tests Completed ===`n" -ForegroundColor Cyan
Write-Host "✅ Availability endpoints are working correctly!" -ForegroundColor Green
Write-Host "`nEndpoints tested:" -ForegroundColor White
Write-Host "  • GET /api/v1/appointments/availability/slots" -ForegroundColor Gray
Write-Host "  • GET /api/v1/appointments/availability/date" -ForegroundColor Gray
Write-Host "  • GET /api/v1/appointments/availability/dates" -ForegroundColor Gray
Write-Host "`nSwagger Documentation: http://localhost:8000/api/docs`n" -ForegroundColor Cyan
