# PowerShell script to trigger phone fields migration on Railway

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "SwapSync - Phone Fields Migration Trigger" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will add missing phone fields to the products table" -ForegroundColor Yellow
Write-Host ""

# Prompt for credentials
$username = Read-Host "Enter your username (manager/admin)"
$password = Read-Host "Enter your password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "🔄 Logging in..." -ForegroundColor Yellow

# Login to get token
$loginUrl = "https://api.digitstec.store/api/auth/login"
$loginBody = "username=$username&password=$passwordPlain"

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/x-www-form-urlencoded"
    $token = $loginResponse.access_token
    
    if ($null -eq $token) {
        Write-Host "❌ Login failed. No token received." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host ""
    
    # Trigger migration
    Write-Host "🔄 Triggering migration..." -ForegroundColor Yellow
    $migrationUrl = "https://api.digitstec.store/api/migrations/add-phone-fields"
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $migrationResponse = Invoke-RestMethod -Uri $migrationUrl -Method Post -Headers $headers
    
    Write-Host ""
    Write-Host "📊 Migration Response:" -ForegroundColor Cyan
    $migrationResponse | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($migrationResponse.success -eq $true) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host "✅ Added fields: $($migrationResponse.added_fields -join ', ')" -ForegroundColor Green
        Write-Host "✅ Total products: $($migrationResponse.total_products)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Please refresh your frontend application." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ Migration may have failed. Please check the response above." -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error occurred: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

