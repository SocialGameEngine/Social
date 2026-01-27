# Script to fix MP3 names by mapping from metadata

$audioMetaDir = "..\audioMeta"
$audioDir = "..\audio"

Write-Host "Fixing MP3 names using metadata mapping..." -ForegroundColor Yellow

# Create exact mapping from metadata to audio files
Get-ChildItem "$audioMetaDir\*.mp3.txt" | ForEach-Object {
    $metaFile = $_
    $cleanName = $metaFile.BaseName  # e.g., "Fog In The Back Room"
    
    # Find corresponding old MP3 file
    $oldMp3 = Get-ChildItem "$audioDir\Noir-*" | Where-Object { 
        $_.Name -replace '^Noir-', '' -replace '_', ' ' -replace '\.mp3$', '' -eq $cleanName
    } | Select-Object -First 1
    
    if ($oldMp3) {
        $newName = "$cleanName.mp3"
        $newPath = Join-Path $audioDir $newName
        
        if (-not (Test-Path $newPath)) {
            Rename-Item $oldMp3.FullName $newPath
            Write-Host "Fixed: $($oldMp3.Name) → $newName" -ForegroundColor Green
        }
    }
}

# Handle " 2" versions
Get-ChildItem "$audioMetaDir\* 2.mp3.txt" | ForEach-Object {
    $metaFile = $_
    $cleanName = $metaFile.BaseName  # e.g., "Fog In The Back Room 2"
    
    # Find corresponding old MP3 file
    $oldMp3 = Get-ChildItem "$audioDir\Noir-* 2.mp3" | Where-Object { 
        $_.Name -replace '^Noir-', '' -replace '_', ' ' -replace ' 2\.mp3$', ' 2' -eq $cleanName
    } | Select-Object -First 1
    
    if ($oldMp3) {
        $newName = "$cleanName.mp3"
        $newPath = Join-Path $audioDir $newName
        
        if (-not (Test-Path $newPath)) {
            Rename-Item $oldMp3.FullName $newPath
            Write-Host "Fixed: $($oldMp3.Name) → $newName" -ForegroundColor Green
        }
    }
}

Write-Host "`n✅ MP3 name fixing complete!" -ForegroundColor Green
