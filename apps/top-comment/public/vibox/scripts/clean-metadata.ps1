# Script to rename metadata and MP3 files using clean titles from metadata

$audioMetaDir = "..\audioMeta"
$audioDir = "..\audio"

if (-not (Test-Path $audioMetaDir)) {
    Write-Host "audioMeta directory not found" -ForegroundColor Red
    exit
}

if (-not (Test-Path $audioDir)) {
    Write-Host "audio directory not found" -ForegroundColor Red
    exit
}

Write-Host "Renaming files using titles from metadata..." -ForegroundColor Yellow

Get-ChildItem "$audioMetaDir\*.mp3.txt" | ForEach-Object {
    $metaFile = $_
    $oldMetaName = $_.Name
    $oldBaseName = $_.BaseName
    
    # Extract title from metadata file
    $titleLine = Get-Content $metaFile.FullName | Where-Object { $_ -match '^Title: ' } | Select-Object -First 1
    
    if ($titleLine) {
        $title = $titleLine -replace '^Title: ', ''
        
        # Clean the title for filename (remove invalid chars)
        $cleanTitle = $title -replace '[^\w\s-]', ''
        $cleanTitle = $cleanTitle -replace '\s+', ' '
        $cleanTitle = $cleanTitle.Trim()
        
        # Remove vibe prefix from clean title (e.g., "Noir-")
        $cleanTitle = $cleanTitle -replace '^[A-Za-z]+-', ''
        
        # Handle collisions by adding numbers
        $counter = 2
        $finalMetaName = "$cleanTitle.mp3.txt"
        $finalMp3Name = "$cleanTitle.mp3"
        
        while (Test-Path (Join-Path $audioMetaDir $finalMetaName)) {
            $finalMetaName = "$cleanTitle $counter.mp3.txt"
            $finalMp3Name = "$cleanTitle $counter.mp3"
            $counter++
        }
        
        # Rename metadata file
        if ($oldMetaName -ne $finalMetaName) {
            Rename-Item (Join-Path $audioMetaDir $oldMetaName) $finalMetaName
            Write-Host "Metadata: $oldMetaName → $finalMetaName" -ForegroundColor Green
        }
        
        # Rename MP3 file if it exists
        $oldMp3Path = Join-Path $audioDir "$oldBaseName.mp3"
        $newMp3Path = Join-Path $audioDir $finalMp3Name
        
        if (Test-Path $oldMp3Path) {
            Rename-Item $oldMp3Path $newMp3Path
            Write-Host "Audio: $oldBaseName.mp3 → $finalMp3Name" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Warning: Could not find title in $oldMetaName" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
