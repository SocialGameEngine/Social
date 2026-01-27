# Script to update tracks.json with clean filenames

$audioDir = "..\audio"
$tracksJsonPath = "..\data\tracks.json"

Write-Host "Updating tracks.json with clean filenames..." -ForegroundColor Yellow

$audioFiles = Get-ChildItem $audioDir | Where-Object { 
    @('.mp3', '.wav', '.flac', '.aac') -contains [System.IO.Path]::GetExtension($_.Name).ToLower()
} | Select-Object -ExpandProperty Name | Sort-Object

$tracksJson = [System.Text.StringBuilder]::new()
$tracksJson.Append("[`r`n") | Out-Null
for ($i = 0; $i -lt $audioFiles.Count; $i++) {
    $tracksJson.Append("    `"$($audioFiles[$i].Replace('"', '\"'))`"") | Out-Null
    if ($i -lt $audioFiles.Count - 1) {
        $tracksJson.Append(",") | Out-Null
    }
    $tracksJson.Append("`r`n") | Out-Null
}
$tracksJson.Append("]") | Out-Null
$tracksJson = $tracksJson.ToString()
$tracksJson | Out-File -FilePath $tracksJsonPath -Encoding UTF8

Write-Host "✅ Updated tracks.json with $($audioFiles.Count) files" -ForegroundColor Green
Write-Host "Files: $($audioFiles -join ', ')" -ForegroundColor Cyan
