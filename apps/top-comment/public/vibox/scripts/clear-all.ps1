# VIBox Clear All Script
# This script completely resets the VIBox system by clearing all files and data

Write-Host "🧹 VIBox Complete Reset Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Get the base directory (scripts folder)
$baseDir = ".."

# Define directories to clear
$directories = @(
    "$baseDir\input",
    "$baseDir\audio", 
    "$baseDir\audioMeta",
    "$baseDir\data"
)

# Confirmation prompt
Write-Host "`n⚠️  WARNING: This will delete ALL files including MP3s!" -ForegroundColor Red
Write-Host "   - All files in input/, audio/, audioMeta/, and data/ directories" -ForegroundColor Red
Write-Host "   - All MP3 audio files" -ForegroundColor Red
Write-Host "   - All metadata files" -ForegroundColor Red
Write-Host "   - All generated JSON files" -ForegroundColor Red
Write-Host "   - All CSV exports" -ForegroundColor Red
Write-Host "   - README.md files will be preserved" -ForegroundColor Green
Write-Host "`n" -ForegroundColor White

$confirmation = Read-Host "Type 'DELETE' to confirm complete reset"

if ($confirmation -eq "DELETE") {
    Write-Host "`n🚀 Starting complete reset..." -ForegroundColor Green
    
    # Clear each directory
    foreach ($dir in $directories) {
        if (Test-Path $dir) {
            Write-Host "Clearing: $dir" -ForegroundColor Yellow
            
            # Get all files except README.md
            $files = Get-ChildItem $dir -File | Where-Object { $_.Name -ne "README.md" }
            
            foreach ($file in $files) {
                try {
                    Remove-Item $file.FullName -Force -Recurse
                    Write-Host "  Removed: $($file.Name)" -ForegroundColor Gray
                }
                catch {
                    Write-Host "  Error removing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            
            $fileCount = $files.Count
            if ($fileCount -gt 0) {
                Write-Host "  ✅ Removed $fileCount files" -ForegroundColor Green
            } else {
                Write-Host "  ℹ️  No files to remove (README.md preserved)" -ForegroundColor Gray
            }
        } else {
            Write-Host "Directory not found: $dir" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    # Clear script outputs (CSV files)
    Write-Host "Clearing script outputs..." -ForegroundColor Yellow
    $csvFiles = Get-ChildItem "." -Filter "*.csv" -File
    foreach ($csv in $csvFiles) {
        try {
            Remove-Item $csv.FullName -Force
            Write-Host "  Removed: $($csv.Name)" -ForegroundColor Gray
        }
        catch {
            Write-Host "  Error removing $($csv.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Write-Host ""
    
    Write-Host "✅ VIBox reset complete!" -ForegroundColor Green
    Write-Host "📁 Directories are now empty (except README files)" -ForegroundColor Green
    Write-Host "🔄 Ready for fresh file processing" -ForegroundColor Green
    
} else {
    Write-Host "`n❌ Reset cancelled. No files were deleted." -ForegroundColor Red
    Write-Host "   Confirmation '$confirmation' did not match 'DELETE'" -ForegroundColor Gray
}

Write-Host "`n" -ForegroundColor White