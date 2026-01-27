# VIBox Master Setup Script
# Cleans UUIDs, moves files, and generates all metadata in one go

# Ensure UTF-8 encoding throughout the script
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🎵 VIBox Master Setup Starting..." -ForegroundColor Cyan

# Step 1: Clean existing metadata files
Write-Host "`n=== Step 1: Cleaning Metadata Files ===" -ForegroundColor Yellow

$audioMetaDir = "..\audioMeta"
$audioDir = "..\audio"
$inputDir = "..\input"
$viboxDir = ".."

if (-not (Test-Path $audioMetaDir)) {
    Write-Host "Creating audioMeta directory..." -ForegroundColor Gray
    New-Item -ItemType Directory -Path $audioMetaDir -Force | Out-Null
}

Get-ChildItem "$audioMetaDir\*.mp3.txt" | Where-Object { $_.Name -match '[a-f0-9-]{36}' } | ForEach-Object {
    $oldName = $_.Name
    $cleanName = $oldName -replace '-[a-f0-9-]{36}'
    $counter = 2
    $finalName = $cleanName
    
    while (Test-Path (Join-Path $audioMetaDir $finalName)) {
        $finalName = $cleanName -replace '\.mp3\.txt$', " $counter.mp3.txt"
        $counter++
    }
    
    if ($oldName -ne $finalName) {
        Rename-Item (Join-Path $audioMetaDir $oldName) $finalName
        Write-Host "Cleaned: $oldName → $finalName" -ForegroundColor Green
    }
}

# Step 2: Move files from input directory
Write-Host "`n=== Step 2: Moving Files ===" -ForegroundColor Yellow

# Function to clean filename by removing UUID
function Clean-Filename($filename) {
    return $filename -replace '-[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}(\.[^.]+)$', '$1'
}

# Function to get unique filename
function Get-UniqueFilename($cleanName, $existingFiles, $isTextFile = $false) {
    $baseName = $cleanName -replace '\.[^.]+$', ''
    $extension = if ($isTextFile) { '.mp3.txt' } else { [System.IO.Path]::GetExtension($cleanName) }
    
    $uniqueName = $cleanName
    $counter = 2
    
    while ($existingFiles -contains $uniqueName) {
        $uniqueName = "$baseName $counter$extension"
        $counter++
    }
    
    return $uniqueName
}

# Move audio files
if (Test-Path $inputDir) {
    $inputFiles = Get-ChildItem $inputDir | Where-Object { 
        @('.mp3', '.wav', '.flac', '.aac') -contains [System.IO.Path]::GetExtension($_.Name).ToLower()
    }
    
    $existingAudioFiles = if (Test-Path $audioDir) { Get-ChildItem $audioDir | Select-Object -ExpandProperty Name } else { @() }
    
    $inputFiles | ForEach-Object {
        $srcPath = $_.FullName
        $mp3FileName = $_.Name
        
        # Find corresponding metadata file to extract title
        $metaFileName = "$($mp3FileName).txt"
        $metaFilePath = Join-Path $inputDir $metaFileName
        
        if (Test-Path $metaFilePath) {
            # Extract title from metadata
            $content = Get-Content $metaFilePath -Raw
            $titleLine = ($content -split '\r?\n') | Where-Object { $_ -match '^Title: ' } | Select-Object -First 1
            
            if ($titleLine) {
                $title = $titleLine -replace '^Title: ', ''
                
                # Clean the title for filename
                $cleanTitle = $title -replace '[^\w\s-]', ''
                $cleanTitle = $cleanTitle -replace '[áàéèíóúüÁÀÉÈÍÓÚÜ]', ''
                $cleanTitle = $cleanTitle -replace '\s+', ' '
                $cleanTitle = $cleanTitle.Trim()
                $cleanTitle = $cleanTitle -replace ' ', '_'
                $cleanTitle = $cleanTitle -replace '^[A-Za-z_]+-', ''
                
                $extension = [System.IO.Path]::GetExtension($mp3FileName)
                $cleanName = "$cleanTitle$extension"
            } else {
                $cleanName = Clean-Filename $mp3FileName
            }
        } else {
            $cleanName = Clean-Filename $mp3FileName
        }
        
        # Get unique name considering already moved files in this batch
        $counter = 2
        $uniqueName = $cleanName
        while ($existingAudioFiles -contains $uniqueName -or (Test-Path (Join-Path $audioDir $uniqueName))) {
            $baseName = $cleanName -replace '\.[^.]+$', ''
            $extension = [System.IO.Path]::GetExtension($cleanName)
            $uniqueName = "$baseName $counter$extension"
            $counter++
        }
        
        $destPath = Join-Path $audioDir $uniqueName
        
        # Only move if source and destination are different
        if ($srcPath -ne $destPath) {
            Move-Item $srcPath $destPath -Force
            Write-Host "Moved: $($_.Name) → $uniqueName" -ForegroundColor Green
        }
        $existingAudioFiles += $uniqueName
    }
    
    # Move text files
    $textFiles = Get-ChildItem $inputDir | Where-Object { $_.Name.EndsWith('.mp3.txt') }
    
    $existingTextFiles = if (Test-Path $audioMetaDir) { Get-ChildItem $audioMetaDir | Select-Object -ExpandProperty Name } else { @() }
    
    $textFiles | ForEach-Object {
        $srcPath = $_.FullName
        
        # Extract title from metadata file content
        $titleLine = Get-Content $_.FullName | Where-Object { $_ -match '^Title: ' } | Select-Object -First 1
        
        if ($titleLine) {
            $title = $titleLine -replace '^Title: ', ''
            
            # Clean the title for filename (remove invalid chars)
            $cleanTitle = $title -replace '[^\w\s-]', ''
            $cleanTitle = $cleanTitle -replace '[Ã¡ÃÃ©ÃÃ³ÃºÃ¼ÃÃÃÃÃÃÃÃ]', '' # Remove accented characters
            $cleanTitle = $cleanTitle -replace '\s+', ' '
            $cleanTitle = $cleanTitle.Trim()
            
            # Replace spaces with underscores for better compatibility
            $cleanTitle = $cleanTitle -replace ' ', '_'
            
            # Remove vibe prefix from clean title (e.g., "Literally_Multicultural-")
            $cleanTitle = $cleanTitle -replace '^[A-Za-z_]+-', ''
            
            $cleanName = "$cleanTitle.mp3.txt"
        } else {
            $cleanName = Clean-Filename $_.Name
        }
        
        # Get unique name considering already moved files in this batch
        $counter = 2
        $uniqueName = $cleanName
        while ($existingTextFiles -contains $uniqueName -or (Test-Path (Join-Path $audioMetaDir $uniqueName))) {
            $baseName = $cleanName -replace '\.mp3\.txt$', ''
            $uniqueName = "$baseName $counter.mp3.txt"
            $counter++
        }
        
        $destPath = Join-Path $audioMetaDir $uniqueName
        
        # Only move if source and destination are different
        if ($srcPath -ne $destPath) {
            Move-Item $srcPath $destPath -Force
            Write-Host "Moved metadata: $($_.Name) → $uniqueName" -ForegroundColor Green
        }
        $existingTextFiles += $uniqueName
    }
}

# Step 3: Generate tracks.json
Write-Host "`n=== Step 3: Generating tracks.json ===" -ForegroundColor Yellow

$audioFiles = Get-ChildItem $audioDir | Where-Object { 
    @('.mp3', '.wav', '.flac', '.aac') -contains [System.IO.Path]::GetExtension($_.Name).ToLower()
} | Select-Object -ExpandProperty Name

$tracksJson = $audioFiles | ConvertTo-Json -Depth 10
$tracksJsonPath = Resolve-Path (Join-Path $viboxDir "data") | Select-Object -ExpandProperty Path
[System.IO.File]::WriteAllText((Join-Path $tracksJsonPath "tracks.json"), $tracksJson, [System.Text.UTF8Encoding]::new($false))

Write-Host "✅ Generated tracks.json with $($audioFiles.Count) files" -ForegroundColor Green

# Step 4: Generate metadata
Write-Host "`n=== Step 4: Generating Metadata ===" -ForegroundColor Yellow

$tracks = @()

Get-ChildItem "$audioMetaDir\*.mp3.txt" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $metaBaseName = $_.Name -replace '\.mp3\.txt$', ''
    
    # Find the actual MP3 file that matches this metadata file
    # Check for exact match first, then numbered versions
    $actualMp3File = $null
    if (Test-Path (Join-Path $audioDir "$metaBaseName.mp3")) {
        $actualMp3File = "$metaBaseName.mp3"
    } else {
        # Look for numbered version (e.g., "Midnight_Alley_Clues 2.mp3")
        $pattern = [regex]::Escape($metaBaseName) + "( \d+)?\.mp3$"
        $matchingFiles = Get-ChildItem $audioDir -Filter "*.mp3" | Where-Object { $_.Name -match $pattern }
        if ($matchingFiles) {
            $actualMp3File = $matchingFiles[0].Name
        } else {
            # Fallback to base name
            $actualMp3File = "$metaBaseName.mp3"
        }
    }
    
    $filename = $actualMp3File
    
    # Extract original title from metadata
    $titleLine = ($content -split '\r?\n') | Where-Object { $_ -match '^Title: ' } | Select-Object -First 1
    $originalTitle = if ($titleLine) { $titleLine -replace '^Title: ', '' } else { $filename -replace '\.mp3$', '' }
    
    # If the filename has a number (e.g., "Song 2.mp3"), append it to the title for display
    if ($filename -match ' (\d+)\.mp3$') {
        $originalTitle = "$originalTitle $($matches[1])"
    }
    
    # Set artist to Söcial for all tracks
    $artist = "Söcial"
    
    # Extract vibe from first line
    $firstLine = ($content -split '\r?\n')[0]
    $vibeFromFilename = "Uncategorized"
    if ($firstLine -match 'Metadata for:\s*([^-\s]+)-') {
        $vibeFromFilename = $matches[1] -replace '_', ' '
    }
    
    # Extract text for genre analysis
    $tags = if ($content -match '"tags":\s*"([^"]+)"') { $matches[1].ToLower() } else { "" }
    $prompt = if ($content -match 'Prompt:\s*([^\n]+)') { $matches[1].Trim().ToLower() } else { "" }
    $gptMood = if ($content -match 'Mood:\s*([^\n"]+)') { $matches[1].Trim().ToLower() } else { "" }
    $allText = "$tags $prompt $gptMood"
    
    # Determine genres
    $genres = @()
    if ($allText -match "drill|trap") { $genres += "Trap" }
    if ($allText -match "hyperpop") { $genres += "Hyperpop" }
    if ($allText -match "drum.and.bass|dnb|jungle|breakbeat") { $genres += "Drum & Bass" }
    if ($allText -match "house|techno|edm") { $genres += "House" }
    if ($allText -match "disco") { $genres += "Disco" }
    if ($allText -match "rock|punk|guitar.*distortion") { $genres += "Rock" }
    if ($allText -match "folk|acoustic|lute|fiddle|mandolin|medieval") { $genres += "Folk" }
    if ($allText -match "cool jazz") { $genres += "Cool Jazz" }
    elseif ($allText -match "jazz|swing|bebop") { $genres += "Jazz" }
    if ($allText -match "blues") { $genres += "Blues" }
    if ($allText -match "lounge") { $genres += "Lounge" }
    if ($allText -match "soundtrack|cinematic|score") { $genres += "Soundtrack" }
    if ($allText -match "ballad") { $genres += "Ballad" }
    if ($allText -match "vintage") { $genres += "Vintage" }
    if ($allText -match "soul|motown") { $genres += "Soul" }
    if ($allText -match "r&b|rnb") { $genres += "R&B" }
    if ($allText -match "funk") { $genres += "Funk" }
    if ($allText -match "reggae|dub|ska") { $genres += "Reggae" }
    if ($allText -match "rap|hip.hop|boom.bap") { $genres += "Hip Hop" }
    if ($allText -match "ambient|drone|soundscape") { $genres += "Ambient" }
    if ($allText -match "chillwave|synthwave|retrowave|vaporwave") { $genres += "Synthwave" }
    if ($allText -match "lo.fi|lofi") { $genres += "Lo-Fi" }
    if ($allText -match "chiptune|8.bit") { $genres += "Chiptune" }
    if ($allText -match "pop|k-pop|j-pop|c-pop|p-pop") { $genres += "Pop" }
    
    if ($genres.Count -eq 0) { $genres += "Electronic" }
    $genre = $genres -join ", "
    
    $tracks += [PSCustomObject]@{
        file = $filename
        title = $originalTitle
        artist = $artist
        primaryVibe = $vibeFromFilename
        genre = $genre
        description = "Extracted from: $firstLine"
    }
}

# Export metadata files - wrap in object with tracks property
$metadataObject = @{ tracks = $tracks }
# Use -Compress to avoid extra whitespace and ensure proper UTF-8 handling
$metadataJson = $metadataObject | ConvertTo-Json -Depth 10 -Compress
$dataPath = Resolve-Path (Join-Path $viboxDir "data") | Select-Object -ExpandProperty Path
# Ensure UTF-8 without BOM
[System.IO.File]::WriteAllText((Join-Path $dataPath "tracks-metadata.json"), $metadataJson, [System.Text.UTF8Encoding]::new($false))

# Create hierarchical structure
$hierarchical = @{ vibes = @{} }
$tracks | Group-Object -Property primaryVibe | ForEach-Object {
    $primaryName = $_.Name
    $hierarchical.vibes[$primaryName] = @(
        $_.Group | ForEach-Object {
            @{
                file = $_.file
                title = $_.title
                artist = $_.artist
                genre = $_.genre
            }
        }
    )
}

# Use -Compress to avoid extra whitespace and ensure proper UTF-8 handling
$hierarchicalJson = $hierarchical | ConvertTo-Json -Depth 10 -Compress
# Ensure UTF-8 without BOM
[System.IO.File]::WriteAllText((Join-Path $dataPath "vibes-hierarchical.json"), $hierarchicalJson, [System.Text.UTF8Encoding]::new($false))

Write-Host "✅ Created metadata files with $($tracks.Count) tracks" -ForegroundColor Green

# Show results
Write-Host "`n=== Results ===" -ForegroundColor Cyan
Write-Host "Vibe Distribution:" -ForegroundColor Yellow
$tracks | Group-Object -Property primaryVibe | Sort-Object Count -Descending | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count) songs" -ForegroundColor Magenta
}

Write-Host "`nGenre Distribution:" -ForegroundColor Yellow
$tracks | Group-Object -Property genre | Sort-Object Count -Descending | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count) songs" -ForegroundColor Magenta
}

Write-Host "`n🎉 VIBox Master Setup Complete!" -ForegroundColor Green
Write-Host "Your VIBox is ready with clean filenames and full metadata!" -ForegroundColor Green
