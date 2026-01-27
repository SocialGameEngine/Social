// VIBox Track Setup Helper
// This script automatically generates tracks.json from MP3 files in this directory
// Cleans UUIDs from filenames and handles duplicates

const fs = require('fs');
const path = require('path');

const viboxDir = path.join(__dirname, '..');
const tracksDir = path.join(viboxDir, 'audio');
const audioMetaDir = path.join(viboxDir, 'audioMeta');
const inputDir = path.join(viboxDir, 'input');

// Function to clean filename by removing UUID
function cleanFilename(filename) {
  return filename.replace(/-[a-f0-9-]{36}(\.[^.]+)$/, '$1');
}

// Function to generate unique filename with collision detection
function getUniqueFilename(cleanName, existingFiles, isTextFile = false) {
  const baseName = cleanName.replace(/\.[^.]+$/, '');
  const extension = isTextFile ? '.mp3.txt' : path.extname(cleanName);
  
  let uniqueName = cleanName;
  let counter = 2;
  
  while (existingFiles.includes(uniqueName)) {
    uniqueName = `${baseName} ${counter}${extension}`;
    counter++;
  }
  
  return uniqueName;
}

// Function to clean existing metadata files
function cleanExistingMetadataFiles() {
  try {
    if (!fs.existsSync(audioMetaDir)) {
      console.log('audioMeta directory not found, skipping cleanup');
      return;
    }
    
    const metadataFiles = fs.readdirSync(audioMetaDir).filter(file => file.endsWith('.mp3.txt'));
    const existingFiles = fs.existsSync(audioMetaDir) ? fs.readdirSync(audioMetaDir) : [];
    
    metadataFiles.forEach(file => {
      const srcPath = path.join(audioMetaDir, file);
      const cleanName = cleanFilename(file);
      
      // Only rename if the file has a UUID
      if (file !== cleanName) {
        let uniqueName = cleanName;
        let counter = 2;
        
        // Handle collisions by adding numbers
        while (existingFiles.includes(uniqueName)) {
          const baseName = cleanName.replace('.mp3.txt', '');
          uniqueName = `${baseName} ${counter}.mp3.txt`;
          counter++;
        }
        
        const destPath = path.join(audioMetaDir, uniqueName);
        
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
        fs.renameSync(srcPath, destPath);
        console.log(`Cleaned metadata: ${file} → ${uniqueName}`);
        
        // Add to existing files for further collision detection
        existingFiles.push(uniqueName);
      }
    });
  } catch (error) {
    console.log('Error cleaning metadata files:', error.message);
  }
}

// Function to move MP3 files from input to audio directory with name cleaning
function moveAudioFiles() {
  try {
    const inputFiles = fs.readdirSync(inputDir);
    const audioFiles = inputFiles.filter(file => 
      ['.mp3', '.wav', '.flac', '.aac'].includes(path.extname(file).toLowerCase())
    );
    
    // Get existing files in destination for collision detection
    const existingFiles = fs.existsSync(tracksDir) ? fs.readdirSync(tracksDir) : [];
    
    audioFiles.forEach(file => {
      const srcPath = path.join(inputDir, file);
      const cleanName = cleanFilename(file);
      const uniqueName = getUniqueFilename(cleanName, existingFiles);
      const destPath = path.join(tracksDir, uniqueName);
      
      // Move file (not copy)
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath); // Remove existing if present
      }
      fs.renameSync(srcPath, destPath);
      console.log(`Moved: ${file} → ${uniqueName}`);
      
      // Add to existing files for further collision detection
      existingFiles.push(uniqueName);
    });
    
    return audioFiles.length;
  } catch (error) {
    console.log('Input directory not found or empty, using existing audio files');
    return 0;
  }
}

// Function to move text files from input to audioMeta directory with name cleaning
function moveTextFiles() {
  try {
    const inputFiles = fs.readdirSync(inputDir);
    const textFiles = inputFiles.filter(file => file.endsWith('.mp3.txt'));
    
    // Get existing files in destination for collision detection
    const existingFiles = fs.existsSync(audioMetaDir) ? fs.readdirSync(audioMetaDir) : [];
    
    textFiles.forEach(file => {
      const srcPath = path.join(inputDir, file);
      const cleanName = cleanFilename(file);
      const uniqueName = getUniqueFilename(cleanName, existingFiles, true);
      const destPath = path.join(audioMetaDir, uniqueName);
      
      // Move file (not copy)
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath); // Remove existing if present
      }
      fs.renameSync(srcPath, destPath);
      console.log(`Moved metadata: ${file} → ${uniqueName}`);
      
      // Add to existing files for further collision detection
      existingFiles.push(uniqueName);
    });
    
    return textFiles.length;
  } catch (error) {
    console.log('No text files to move');
    return 0;
  }
}

// Function to scan for audio files
function scanAudioFiles() {
  const files = fs.readdirSync(tracksDir);
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac'];
  
  return files
    .filter(file => audioExtensions.includes(path.extname(file).toLowerCase()))
    .filter(file => !file.includes('tracks.json') && !file.includes('setup-tracks.js') && file !== 'README.md');
}

// Function to generate tracks.json
function generateTracksJSON() {
  // First move any new files from input
  const movedAudioFiles = moveAudioFiles();
  const movedTextFiles = moveTextFiles();
  
  if (movedAudioFiles > 0) {
    console.log(`Moved ${movedAudioFiles} audio files from input to audio/`);
  }
  if (movedTextFiles > 0) {
    console.log(`Moved ${movedTextFiles} text files from input to audioMeta/`);
  }
  
  // Then clean the metadata files that were just moved
  cleanExistingMetadataFiles();
  
  const audioFiles = scanAudioFiles();
  
  console.log(`Found ${audioFiles.length} audio files:`);
  audioFiles.forEach(file => {
    console.log(`  - ${file}`);
  });

  // Write tracks.json to data folder
  const tracksJSON = JSON.stringify(audioFiles, null, 2);
  fs.writeFileSync(path.join(viboxDir, 'data', 'tracks.json'), tracksJSON);
  
  console.log(`\n✅ Generated tracks.json with ${audioFiles.length} files`);
  
  if (audioFiles.length === 0) {
    console.log('\nTo add tracks:');
    console.log('1. Copy MP3 files to the audio/ directory');
    console.log('2. Run: node scripts/setup-tracks.js');
    console.log('3. Rebuild and deploy to Vercel');
  } else {
    console.log('\nYour tracks will be available at:');
    audioFiles.forEach(file => {
      console.log(`  https://your-domain.vercel.app/vibox/audio/${file}`);
    });
    console.log('\n✅ Ready for deployment!');
  }
}

// Run the script
generateTracksJSON();
