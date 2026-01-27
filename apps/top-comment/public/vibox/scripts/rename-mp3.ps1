# Script to rename MP3 files to match clean metadata names

$audioMetaDir = "..\audioMeta"
$audioDir = "..\audio"

Write-Host "Renaming MP3 files to match clean metadata names..." -ForegroundColor Yellow

Get-ChildItem "$audioMetaDir\*.mp3.txt" | ForEach-Object {
    $metaFile = $_
    $cleanMetaName = $_.BaseName  # This is the clean name without .mp3.txt
    $cleanMp3Name = "$cleanMetaName.mp3"
    
    # Find the corresponding old MP3 file (look for Noir- prefix)
    $oldMp3Files = Get-ChildItem "$audioDir\Noir-$cleanMetaName*.mp3" -ErrorAction SilentlyContinue
    
    if ($oldMp3Files) {
        foreach ($oldMp3 in $oldMp3Files) {
            $newMp3Path = Join-Path $audioDir $cleanMp3Name
            
            # Handle duplicates
            $counter = 2
            $finalMp3Name = $cleanMp3Name
            while (Test-Path (Join-Path $audioDir $finalMp3Name)) {
                $finalMp3Name = "$cleanMetaName $counter.mp3"
                $counter++
            }
            
            if ($oldMp3.Name -ne $finalMp3Name) {
                Rename-Item $oldMp3.FullName (Join-Path $audioDir $finalMp3Name)
                Write-Host "Audio: $($oldMp3.Name) → $finalMp3Name" -ForegroundColor Cyan
            }
        }
    }
}

Write-Host "`n✅ MP3 renaming complete!" -ForegroundColor Green
