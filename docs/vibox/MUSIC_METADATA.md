# VIBox Music Metadata

## Overview

This section contains the music metadata and vibe classification data used by the VIBox AI jukebox system.

## Files

### 1. tracks-metadata.json
**Purpose**: Complete metadata for all music tracks in the VIBox library
**Size**: 79KB
**Usage**: Source data for track information and vibe classification

**Structure**:
```json
{
    "tracks": [
        {
            "file": "Aetherial Dreams.mp3",
            "artist": "Söcial",
            "primaryVibe": "Upbeat",
            "secondaryVibe": "Bright & Bubbly",
            "genre": "Electronic"
        },
        // ... more tracks
    ]
}
```

**Track Information**:
- **File**: Filename of the audio file
- **Artist**: Track artist or "Söcial" for generated content
- **Primary Vibe**: Main mood classification
- **Secondary Vibe**: Additional mood descriptor
- **Genre**: Musical genre classification

### 2. vibes-hierarchical.json
**Purpose**: Hierarchical organization of music vibes with track listings
**Size**: 102KB
**Usage**: Vibe-based music selection and categorization

**Structure**:
```json
{
    "vibes": {
        "Upbeat": {
            "total": 134,
            "secondaryVibes": {
                "Upbeat": [
                    {
                        "file": "Crystal Dreams.mp3",
                        "genre": "House"
                    },
                    // ... more tracks
                ]
                // ... more secondary vibes
            }
        },
        // ... more primary vibes
    }
}
```

**Vibe Hierarchy**:
- **Primary Vibes**: Main mood categories (Upbeat, Chill, Dark, etc.)
- **Secondary Vibes**: Sub-categories within primary vibes
- **Track Listings**: Files associated with each vibe combination

## Vibe Classification System

### Primary Vibes
1. **Upbeat** - Energetic, positive, dance-worthy
2. **Chill** - Relaxed, calm, soothing
3. **Dark** - Moody, intense, dramatic
4. **Party** - High-energy, celebratory
5. **Focus** - Concentration, work-friendly
6. **Romantic** - Love, intimacy, emotional
7. **Nostalgic** - Retro, memories, classic
8. **Experimental** - Avant-garde, unique

### Secondary Vibes
- **Bright & Bubbly** - Light, cheerful, sparkling
- **Deep & Atmospheric** - Rich, immersive, layered
- **Energetic & Driving** - High-tempo, motivating
- **Smooth & Flowing** - Gentle, continuous, fluid
- **Moody & Introspective** - Thoughtful, emotional
- **Playful & Fun** - Lighthearted, whimsical

### Genre Categories
- **Electronic** - EDM, synth, digital
- **House** - 4/4 beat, dance-oriented
- **Ambient** - Atmospheric, background
- **Experimental** - Innovative, boundary-pushing
- **Lo-Fi** - Low fidelity, relaxed
- **Techno** - Industrial, mechanical

## Usage in VIBox System

### Vibe Selection
1. **User Selection**: Patrons choose primary vibe (chill/hype/party)
2. **AI Generation**: Suno API generates track based on vibe
3. **Metadata Assignment**: Generated tracks get vibe metadata
4. **Library Integration**: Tracks added to appropriate vibe categories

### Track Management
```typescript
// Example vibe selection logic
function selectTracksByVibe(primaryVibe: string, count: number): Track[] {
  const vibeData = vibesHierarchical[primaryVibe];
  const allTracks = Object.values(vibeData.secondaryVibes).flat();
  return shuffleArray(allTracks).slice(0, count);
}
```

### Queue Management
- **Vibe Matching**: Ensure queue maintains consistent vibe
- **Variety**: Mix secondary vibes within primary selection
- **Transitions**: Smooth transitions between compatible vibes

## Data Quality Standards

### Metadata Requirements
- **File Names**: Consistent formatting, no special characters
- **Artist Names**: Proper capitalization, consistent
- **Vibe Labels**: Standardized terminology
- **Genre Classification**: Accurate and specific

### Quality Control
- **Audio Verification**: All tracks playable and complete
- **Vibe Accuracy**: Manual verification of vibe assignments
- **Consistency**: Standardized formatting across all entries
- **Completeness**: All required fields populated

## Maintenance Procedures

### Regular Updates
- **New Tracks**: Add metadata for newly generated tracks
- **Vibe Refinement**: Adjust vibe classifications based on feedback
- **Genre Updates**: Keep genre classifications current
- **Quality Checks**: Regular audio and metadata verification

### Data Synchronization
- **Database Sync**: Ensure metadata matches database records
- **File System**: Verify audio files exist and match metadata
- **Backup**: Regular backups of metadata files
- **Version Control**: Track changes to vibe classifications

## Integration Points

### Suno API Integration
```typescript
// Generate track with vibe metadata
async function generateTrack(vibe: string): Promise<Track> {
  const sunoResponse = await sunoAPI.generate({
    vibe: vibe,
    duration: 120,
    style: getStyleForVibe(vibe)
  });
  
  return {
    file: sunoResponse.filename,
    artist: "Söcial",
    primaryVibe: vibe,
    secondaryVibe: getSecondaryVibe(vibe),
    genre: inferGenre(vibe)
  };
}
```

### Database Storage
- **Tracks Table**: Store track metadata with file references
- **Vibe Indexing**: Efficient lookup by vibe combinations
- **Search Optimization**: Full-text search on metadata
- **Analytics**: Track vibe popularity and usage patterns

---

*Last updated: January 2026*
