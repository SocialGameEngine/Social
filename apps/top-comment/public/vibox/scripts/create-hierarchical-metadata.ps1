# Script to create simple metadata with primary vibe and genre (no sub-vibes)

$tracks = @()

# Read all metadata files from the audioMeta directory
$audioMetaDir = "..\audioMeta"

Get-ChildItem "$audioMetaDir\*.mp3.txt" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # Use the cleaned .txt filename (already matches MP3 filename)
    $filename = $_.Name -replace '\.mp3\.txt$', '.mp3'
    
    # Extract vibe from first line (Metadata for: line)
    $firstLine = ($content -split '\r?\n')[0]
    $vibeFromFilename = "Uncategorized"
    if ($firstLine -match 'Metadata for:\s*([^-\s]+)-') {
        $vibeFromFilename = $matches[1] -replace '_', ' '
    }
    
    # Extract tags/description for genre analysis
    $tags = if ($content -match '"tags":\s*"([^"]+)"') { $matches[1].ToLower() } else { "" }
    $prompt = if ($content -match 'Prompt:\s*([^\n]+)') { $matches[1].Trim().ToLower() } else { "" }
    $gptMood = if ($content -match 'Mood:\s*([^\n"]+)') { $matches[1].Trim().ToLower() } else { "" }
    
    # Combine all text for genre analysis only
    $allText = "$tags $prompt $gptMood"
    
    # Use vibe from filename (no sub-vibes)
    $primaryVibe = $vibeFromFilename
    
    # Determine GENRES (can have multiple genres)
    $genres = @()
    
    if ($allText -match "drill|trap") {
        $genres += "Trap"
    }
    if ($allText -match "hyperpop") {
        $genres += "Hyperpop"
    }
    if ($allText -match "drum.and.bass|dnb|jungle|breakbeat") {
        $genres += "Drum & Bass"
    }
    if ($allText -match "house|techno|edm") {
        $genres += "House"
    }
    if ($allText -match "disco") {
        $genres += "Disco"
    }
    if ($allText -match "rock|punk|guitar.*distortion") {
        $genres += "Rock"
    }
    if ($allText -match "folk|acoustic|lute|fiddle|mandolin|medieval") {
        $genres += "Folk"
    }
    if ($allText -match "cool jazz") {
        $genres += "Cool Jazz"
    }
    elseif ($allText -match "jazz|swing|bebop") {
        $genres += "Jazz"
    }
    if ($allText -match "blues") {
        $genres += "Blues"
    }
    if ($allText -match "lounge") {
        $genres += "Lounge"
    }
    if ($allText -match "soundtrack|cinematic|score") {
        $genres += "Soundtrack"
    }
    if ($allText -match "ballad") {
        $genres += "Ballad"
    }
    if ($allText -match "vintage") {
        $genres += "Vintage"
    }
    if ($allText -match "soul|motown") {
        $genres += "Soul"
    }
    if ($allText -match "r&b|rnb") {
        $genres += "R&B"
    }
    if ($allText -match "funk") {
        $genres += "Funk"
    }
    if ($allText -match "reggae|dub|ska") {
        $genres += "Reggae"
    }
    if ($allText -match "rap|hip.hop|boom.bap") {
        $genres += "Hip Hop"
    }
    if ($allText -match "ambient|drone|soundscape") {
        $genres += "Ambient"
    }
    if ($allText -match "chillwave|synthwave|retrowave|vaporwave") {
        $genres += "Synthwave"
    }
    if ($allText -match "lo.fi|lofi") {
        $genres += "Lo-Fi"
    }
    if ($allText -match "chiptune|8.bit") {
        $genres += "Chiptune"
    }
    if ($allText -match "pop|k-pop|j-pop|c-pop|p-pop") {
        $genres += "Pop"
    }
    
    # If no genres matched, default to Electronic
    if ($genres.Count -eq 0) {
        $genres += "Electronic"
    }
    
    # Join genres into a comma-separated string
    $genre = $genres -join ", "
    
    # Create track object with simple structure (no sub-vibes)
    $track = [PSCustomObject]@{
        file = $filename
        primaryVibe = $primaryVibe
        genre = $genre
        description = "Extracted from: $firstLine"
    }
    
    $tracks += $track
}

# Export to JSON with proper UTF-8 encoding
$PSDefaultParameterValues['Out-File:Encoding'] = 'UTF8'
$tracks | ConvertTo-Json -Depth 10 | Out-File "..\data\tracks-metadata.json" -NoNewline
Write-Host "`n✅ Created ..\data\tracks-metadata.json with $($tracks.Count) tracks" -ForegroundColor Green
Write-Host "   Each track has: file, primaryVibe, genre" -ForegroundColor Cyan

# Show distribution
Write-Host "`n=== VIBE DISTRIBUTION ===" -ForegroundColor Yellow
$tracks | Group-Object -Property primaryVibe | Sort-Object Count -Descending | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count) songs" -ForegroundColor Magenta
}

Write-Host "`n=== GENRE DISTRIBUTION ===" -ForegroundColor Yellow
$tracks | Group-Object -Property genre | Sort-Object Count -Descending | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count) songs"
}

# Create simple flat structure for jukebox UI (no sub-vibes)
$hierarchical = @{
    vibes = @{}
}

$primaryGroups = $tracks | Group-Object -Property primaryVibe
foreach ($primaryGroup in $primaryGroups) {
    $primaryName = $primaryGroup.Name
    $hierarchical.vibes[$primaryName] = @(
        $primaryGroup.Group | ForEach-Object {
            @{
                file = $_.file
                genre = $_.genre
            }
        }
    )
}

# Export hierarchical structure
$hierarchical | ConvertTo-Json -Depth 10 | Out-File "..\data\vibes-hierarchical.json" -NoNewline
Write-Host "`n✅ Created ..\data\vibes-hierarchical.json with flat vibe structure" -ForegroundColor Green
