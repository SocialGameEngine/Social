# Deployment script for Mashup Mode transformation
# This script deploys the modified edge functions for the top-comment app.

Write-Host "Starting Mashup Mode deployment..." -ForegroundColor Cyan

# 1. Apply Database Migration
Write-Host "Applying database migrations..." -ForegroundColor Yellow
supabase db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "Database migration failed. Please check the error above." -ForegroundColor Red
    exit 1
}

# 2. Deploy Edge Functions
Write-Host "Deploying edge functions..." -ForegroundColor Yellow

$functions = @(
    "top-comment-sessions-create",
    "top-comment-sessions-start",
    "top-comment-sessions-advance",
    "top-comment-sessions-update"
)

foreach ($func in $functions) {
    Write-Host "  - Deploying $func..." -ForegroundColor Gray
    supabase functions deploy $func --no-verify-jwt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to deploy $func" -ForegroundColor Red
        exit 1
    }
}

# 3. Cleanup (Optional)
Write-Host "Cleaning up obsolete functions..." -ForegroundColor Yellow
Write-Host "  - Note: You may want to manually delete top-comment-sessions-select-category from the Supabase dashboard." -ForegroundColor Gray

Write-Host "Mashup Mode deployment complete!" -ForegroundColor Green
