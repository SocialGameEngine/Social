# Script to rename all MP3 files to match clean metadata names

$audioMetaDir = "..\audioMeta"
$audioDir = "..\audio"

Write-Host "Renaming all MP3 files to match clean metadata names..." -ForegroundColor Yellow

# Create mapping from clean names to old files
$mapping = @{}

Get-ChildItem "$audioMetaDir\*.mp3.txt" | ForEach-Object {
    $cleanName = $_.BaseName
    $mapping[$cleanName] = $true
}

# Rename each old MP3 file
Get-ChildItem "$audioDir\Noir-*.mp3" | ForEach-Object {
    $oldFile = $_
    $oldName = $_.Name
    
    # Remove "Noir-" prefix to get clean name
    $cleanName = $oldName -replace '^Noir-', ''
    
    # Handle special case for " 2" suffix
    if ($cleanName -match '^(.+?) 2\.mp3$') {
        $baseName = $matches[1]
        $cleanName = "$baseName 2.mp3"
    }
    
    $newPath = Join-Path $audioDir $cleanName
    
    if ($oldName -ne $cleanName -and -not (Test-Path $newPath)) {
        Rename-Item $oldFile.FullName $newPath
        Write-Host "Renamed: $oldName → $cleanName" -ForegroundColor Green
    }
}

Write-Host "`n✅ MP3 renaming complete!" -ForegroundColor Green
