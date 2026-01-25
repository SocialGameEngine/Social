# VIBox Input Directory

This folder is designed to receive MP3 files and their corresponding metadata files for processing.

## Usage

1. **Add files**: Place `.mp3` and `.mp3.txt` files in this directory
2. **Run scripts**: Execute any of the scripts in the `../scripts/` directory
3. **Results**: Generated JSON files will appear in the `../data/` directory

## File Requirements

- **MP3 files**: Audio files (e.g., `song-name.mp3`)
- **Metadata files**: Text files with same base name (e.g., `song-name.mp3.txt`)
- **Matching pairs**: Each MP3 should have a corresponding `.txt` file

## Script Processing

The scripts will automatically:
- Scan this directory for `.mp3.txt` files
- Extract metadata from the text files
- Generate JSON files in the `../data/` folder
- Create categorizations based on the metadata content

## Example Workflow

```bash
# 1. Add your files
cp my-song.mp3 ../input/
cp my-song.mp3.txt ../input/

# 2. Process with any script
cd ../scripts
powershell -ExecutionPolicy Bypass -File create-full-metadata.ps1

# 3. Check results
ls ../data/
```

## Notes

- Scripts only read from this directory - they don't modify files here
- MP3 files are copied to `../audio/` by the setup script
- Metadata is extracted from `.txt` files for categorization
