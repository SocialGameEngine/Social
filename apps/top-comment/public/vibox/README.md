# VIBox Audio Assets

This directory contains audio files for the VIBox jukebox functionality.

## 🎵 **Music Collection (1000+ Tracks)**

Your AI-generated music collection now has **smart, context-aware song titles** that match the actual music content:

### **🎯 Smart Context-Aware Title Examples:**
- **Funk/Soul/Motown**: `vibox-Night_of_Questions-...` → `Funky Playful.mp3`
- **Celtic Music**: `vibox-Tipsy_Tales-...` → `Celtic Bouncy.mp3`
- **Jazz**: `vibox-Smooth_Vibes-...` → `Midnight Jazz.mp3`
- **Funk Groove**: `vibox-Funky_Beat-...` → `Funk Bass.mp3`
- **Blues**: `vibox-Blue_Feeling-...` → `Blues Piano.mp3`

### **🧠 Smart Naming Intelligence:**
- **Deep Prompt Analysis**: Extracts genre, vibe, instruments, mood, and tempo from the full prompt description
- **Vibe-First Approach**: Prioritizes vibe + mood + instrument combinations for the most specific, accurate titles
- **Genre-Specific Templates**: Different naming patterns for funk, soul, motown, celtic, pirate, jazz, blues, and more
- **Instrument Recognition**: Incorporates specific instruments (bass, piano, horns, accordion, fiddle, etc.)
- **Gangsta Rap Detection**: Only marks hip hop/rap tracks as gangsta when they actually contain gangsta indicators
- **Ensured uniqueness** across all 1000+ tracks

### **🎭 Title Categories by Genre:**

**Vibe-Based (Genre-Specific):**
- **Funk**: `Funky Groove`, `Funk Bass`, `Funk Guitar`, `Get Down`
- **Soul**: `Soulful Nights`, `Warm Soul`, `Soul Vibes`, `Smooth Soul`
- **Motown**: `Motown Groove`, `Dancing Motown`, `Motown Night`, `Classic Motown`
- **Celtic**: `Celtic Dance`, `Joyful Jig`, `Fiddle Tales`, `Celtic Journey`
- **Pirate**: `Pirate Tales`, `Swashbuckling Seas`, `Accordion Voyage`, `Bouncy Seas`
- **Jazz**: `Smooth Jazz`, `Jazz Night`, `Cool Jazz`, `Bouncy Jazz`
- **Blues**: `Blue Blues`, `Blues Piano`, `Slow Blues`, `Blues Feeling`

**Generic Positive (Fallback):**
- **Nature**: `Crystal Journey`, `Golden Light`, `Beautiful Days`, `Sparkling Moon`
- **Emotional**: `Happy Love`, `Joyful Dreams`, `Radiant Song`, `Peaceful Melody`
- **Poetic**: `Dreaming Rainbow`, `Glowing Rainbow`, `Flying Light`, `Dancing Moon`

### **Examples of Smart Context-Aware Titles:**
```
🎺 Funk/Soul/Motown Examples:
Funky Playful.mp3             # Playful funk groove
Funky Bouncy.mp3              # Bouncy funk rhythm
Funk Bass.mp3                 # Funk track featuring bass
Warm Soul.mp3                 # Soulful, warm atmosphere
Funk Guitar.mp3               # Funky guitar-driven track
Soul Bass.mp3                 # Soul music with bass
Mid-tempo Soul.mp3            # Mid-tempo soul groove
Bouncy Motown.mp3             # Upbeat Motown sound

🎻 Celtic/Pirate Examples:
Celtic Dance.mp3              # Celtic jig or reel
Celtic Bouncy.mp3             # Bouncy Celtic rhythm
Bouncy Seas.mp3               # Pirate adventure music
Fiddle Tales.mp3              # Celtic fiddle storytelling
Celtic Journey.mp3            # Celtic adventure music

🎷 Jazz/Blues Examples:
Midnight Jazz.mp3             # Smooth jazz
Jazz Piano.mp3                # Jazz featuring piano
Blues Piano.mp3               # Blues featuring piano
Bouncy Jazz.mp3               # Upbeat jazz groove
Cool Jazz.mp3                 # Cool jazz vibes
Warm Jazz.mp3                 # Warm jazz atmosphere
Jazz Bass.mp3                 # Jazz with bass
Mid-tempo Jazz.mp3            # Mid-tempo jazz groove

🌟 Positive Examples:
Crystal Journey.mp3           # Ethereal, ambient exploration
Golden Light.mp3              # Bright, uplifting electronic
Beautiful Days.mp3            # Warm, nostalgic melody
Dancing Angel.mp3             # Playful, rhythmic instrumental
Sparkling Sea.mp3             # Joyful, bouncy track
```

## 📁 **File Structure**

```
public/vibox/
├── tracks.json          # Complete track list for VIBox
├── *.mp3               # 1000+ genre-appropriate titled audio files
├── README.md           # This file
└── setup-tracks.js     # Track management script
```

## 🚀 **Usage**

The VIBox jukebox will automatically load all tracks from `tracks.json`. Files are served via Vercel CDN for optimal performance.

### **For Hosts:**
- Full control over playback
- Can add/remove tracks (uploaded tracks only)
- Volume and playback controls

### **For Teams:**
- View and control playback
- Access same music library
- Cannot modify track list

## 🎯 **Technical Details**

- **Total Files**: 1000+ MP3 tracks
- **Naming**: Smart, context-aware titles based on deep prompt analysis
- **Format**: MP3 (AI-generated instrumental)
- **Access**: Static files via Vercel CDN
- **Compatibility**: Works with VIBox modal system

## 🧠 **Smart Context-Aware Title Intelligence**

All track titles were generated using advanced prompt analysis that extracts rich metadata:

### **📊 Title Generation Priority System:**
1. **Vibe + Mood + Instrument** (Most Specific): "Funk Bass", "Blues Piano", "Celtic Bouncy"
2. **Genre + Mood**: "Smooth Jazz", "Funky Groove", "Warm Soul"
3. **Gangsta Rap** (Hip Hop/Rap only): "Street Game", "Real Hustle"
4. **Generic Positive** (Fallback): "Crystal Journey", "Golden Light"

### **🎯 Deep Metadata Extraction:**
- **Full Prompt Analysis**: Extracts complete prompt description, not just tags
- **Display Tags**: Uses official genre tags (funk, soul, motown, jazz, blues, etc.)
- **Vibe Recognition**: Identifies motown, funk, soul, celtic, pirate, jazz, blues, and 40+ other vibes
- **Instrument Extraction**: Detects 35+ instruments (bass, piano, horns, accordion, fiddle, drums, etc.)
- **Mood Analysis**: Captures playful, warm, cozy, energetic, chill, and 50+ moods
- **Tempo Indicators**: Recognizes mid-tempo, uptempo, slow, fast, bouncy, driving, etc.
- **Style Descriptors**: Identifies live-band, acoustic, electric, minimal, layered, tight, etc.

### **🎭 Genre-Specific Intelligence:**
- **Funk/Soul/Motown**: Creates authentic titles like "Funky Playful", "Funk Bass", "Warm Soul"
- **Celtic/Pirate**: Generates thematic titles like "Celtic Dance", "Bouncy Seas", "Celtic Bouncy"
- **Jazz/Blues**: Produces atmospheric titles like "Midnight Jazz", "Blues Piano", "Cool Jazz"
- **Gangsta Rap**: Only applied to actual hip hop/rap with gangsta indicators
- **All Other Genres**: Positive, family-friendly titles appropriate for any venue

### **Title Generation Process:**
1. **Extract full prompt** from metadata (not just tags)
2. **Parse display_tags** for official genre classification
3. **Identify vibe/style** (motown, funk, soul, celtic, pirate, jazz, blues, etc.)
4. **Extract instruments** and mood descriptors
5. **Apply priority system** to generate most specific, accurate title
6. **Ensure uniqueness** across all 1000+ tracks

### **Why This Works Better:**
- **"Night of Questions"** (funk/soul/motown) → **"Funky Playful"** ✓
  - NOT "Low Bread" ✗ (generic gangsta name)
- **"Tipsy Tales"** (celtic pirate) → **"Celtic Bouncy"** ✓
  - NOT "Walking Devil" ✗ (random negative words)
- **Smooth jazz** → **"Midnight Jazz"** ✓
  - NOT "Crystal Echo" ✗ (generic positive)

🎵 **Your VIBox jukebox now has 1000+ tracks with smart, context-aware titles that actually match the music content!**
