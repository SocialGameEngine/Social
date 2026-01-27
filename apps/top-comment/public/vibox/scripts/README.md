# VIBox Scripts

This directory contains scripts for managing VIBox audio metadata and categorization.

## Directory Structure

```
vibox/
├── input/          # Drop MP3 + .txt files here for processing
├── audio/          # Processed MP3 files (moved from input)
├── audioMeta/      # Processed .txt files (moved from input)
├── data/           # Generated JSON files
└── scripts/        # Management scripts
```

## Scripts

### setup-tracks.cjs
- **Purpose**: Moves MP3s from input/ to audio/ and .txt files to audioMeta/, then generates tracks.json
- **Usage**: `node setup-tracks.cjs`
- **Output**: `../data/tracks.json`
- **Features**: Auto-moves files from input directory

### categorize-by-vibe.ps1
- **Purpose**: Categorizes tracks by vibe based on metadata analysis
- **Usage**: `powershell -ExecutionPolicy Bypass -File categorize-by-vibe.ps1`
- **Output**: `../data/vibes.json`
- **Dependencies**: Requires `.mp3.txt` files in `../audioMeta/`

### create-hierarchical-metadata.ps1
- **Purpose**: Creates hierarchical metadata with primary/secondary vibes and genres
- **Usage**: `powershell -ExecutionPolicy Bypass -File create-hierarchical-metadata.ps1`
- **Output**: `../data/tracks-metadata.json`, `../data/vibes-hierarchical.json`
- **Dependencies**: Requires `.mp3.txt` files in `../audioMeta/`

### create-full-metadata.ps1
- **Purpose**: Creates comprehensive metadata with detailed vibe, genre, and artist information
- **Usage**: `powershell -ExecutionPolicy Bypass -File create-full-metadata.ps1`
- **Output**: `../data/tracks-metadata.json`, `../data/vibes.json`
- **Features**: Most detailed analysis with extensive genre and vibe classification
- **Dependencies**: Requires `.mp3.txt` files in `../audioMeta/`

## Workflow

1. **Add files**: Place `.mp3` and `.mp3.txt` files in `../input/`
2. **Process tracks**: `node setup-tracks.cjs` (moves MP3s to audio/, .txt files to audioMeta/)
3. **Generate metadata**: Run any PowerShell script for categorization
4. **Check results**: View generated JSON files in `../data/`

## Usage

```bash
# Complete workflow
cd ../scripts

# Step 1: Process audio files
node setup-tracks.cjs

# Step 2: Generate metadata (choose one)
powershell -ExecutionPolicy Bypass -File create-full-metadata.ps1
# OR
powershell -ExecutionPolicy Bypass -File create-hierarchical-metadata.ps1
# OR  
powershell -ExecutionPolicy Bypass -File categorize-by-vibe.ps1
```

## Recommendations

- **For richest metadata**: Use `create-full-metadata.ps1`
- **For complex UI navigation**: Use `create-hierarchical-metadata.ps1`
- **For basic categorization**: Use `categorize-by-vibe.ps1`

## Notes

- PowerShell scripts require execution policy bypass
- All scripts read from `../audioMeta/` directory (processed metadata)
- Audio files are automatically moved to `../audio/` by setup script
- Text files are automatically moved to `../audioMeta/` by setup script
- Generated files are placed in `../data/` directory
- Each MP3 should have a corresponding `.mp3.txt` metadata file
- Input directory is cleared after processing (files are moved, not copied)
