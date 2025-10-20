# PowerShell script to clear all POS sales data
# WARNING: This permanently deletes all sales history!

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  CLEAR ALL POS SALES DATA" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  WARNING: This will delete ALL POS sales history!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Are you sure you want to continue? (Type YES to confirm)"

if ($confirmation -ne "YES") {
    Write-Host "❌ Operation cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
$token = Read-Host "Enter your access token (from browser DevTools > LocalStorage > access_token)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Access token is required!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Choose environment:" -ForegroundColor Cyan
Write-Host "1. Local (http://localhost:8000)"
Write-Host "2. Production (https://api.digitstec.store)"
$env = Read-Host "Enter 1 or 2"

$apiUrl = if ($env -eq "1") { "http://localhost:8000/api/admin/clear-pos-sales" } else { "https://api.digitstec.store/api/admin/clear-pos-sales" }

Write-Host ""
Write-Host "🗑️  Clearing POS sales data..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers
    
    Write-Host ""
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deleted:" -ForegroundColor Cyan
    Write-Host "  - POS Sales: $($response.deleted.pos_sales)" -ForegroundColor White
    Write-Host "  - POS Items: $($response.deleted.pos_sale_items)" -ForegroundColor White
    Write-Host "  - Product Sales: $($response.deleted.product_sales)" -ForegroundColor White
    Write-Host "  - Stock Movements: $($response.deleted.stock_movements)" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 All POS sales data has been cleared!" -ForegroundColor Green
    Write-Host "👉 Refresh your POS pages to see the changes." -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Invalid or expired access token" -ForegroundColor White
    Write-Host "  - You're not logged in as SUPER_ADMIN" -ForegroundColor White
    Write-Host "  - Backend API is not running" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"

