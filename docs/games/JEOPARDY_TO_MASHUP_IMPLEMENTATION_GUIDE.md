# Jeopardy to Mashup Mode Implementation Guide

## Overview

This guide covers the simplification and renaming of Jeopardy mode to "Mashup" mode. The new Mashup mode simplifies the category selection system while maintaining the core gameplay loop of rotating through multiple libraries.

---

## 🎯 Mode Transformation

### Jeopardy Mode (Current)
- **6×7 grid system** (42 total prompts)
- **Host-controlled category selection**
- **Strategic category depletion**
- **Complex grid management**
- **Category grid management**

### Mashup Mode (New)
- **Simple library rotation** system
- **Host selects multiple libraries**
- **Automatic round-robin category rotation**
- **Simplified rotation logic**
- **Streamlined gameplay flow**

---

## 🔄 Key Changes Required

### 1. Terminology Updates

#### UI Labels & Text
```typescript
// OLD - Jeopardy references to replace:
"Jeopardy Mode" → "Mashup Mode"
"Category Grid" → "Library Rotation"
"Category Selection" → "Library Setup"
"Select Category" → "Next Library"
"Category depletion" → "Library rotation"

// NEW - Mashup-specific terms:
"Library Rotation" - The cycling through selected libraries
"Library Setup" - Initial configuration by host
"Round Robin" - Automatic rotation system
"Library Pool" - Collection of selected libraries
```

#### Component Names
```typescript
// File deletions (no longer needed):
CategoryGrid.tsx → DELETE
CategorySelectPhase.tsx → DELETE
categoryGrid.ts → DELETE

// No new components needed - uses existing Classic flow
```

### 2. Simplified Game Flow

#### Classic Mode (Unchanged)
- **24 categories** available for selection
- **Random category selection** each round
- **Simple flow**: Lobby → Answer → Vote → Results → Repeat

#### Mashup Mode (New)
- **Host selects 2-6 libraries** during session creation
- **Automatic rotation** through selected libraries each round
- **Identical flow to Classic**: Lobby → Answer → Vote → Results → Repeat
- **No extra phases** - rotation happens automatically between rounds

---

## 📋 Implementation Plan

### Phase 1: Type System Updates

#### Files to Modify
- `src/shared/types.ts`

#### Changes Required
```typescript
// Update game mode type
interface SessionSettings {
  gameMode?: "classic" | "mashup";  // Changed from "jeopardy"
  selectedLibraries?: string[];    // New: array of library IDs (2-6 max)
  currentLibraryIndex?: number;    // New: track rotation position
}

// NO CHANGES to SessionStatus - uses existing phases
export type SessionStatus = 
  | "lobby" 
  | "answer"     // Same as Classic
  | "vote" 
  | "results" 
  | "ended";

// Simplify session interface
interface Session {
  // ... existing fields
  selectedLibraries?: string[];     // Replace categoryGrid
  currentLibraryIndex?: number;     // Replace complex grid
  gameMode?: "classic" | "mashup";
}

// Remove ALL Jeopardy-specific interfaces
// DELETE: CategoryGrid, CategorySelectionRequest, CategorySelectionResponse
// DELETE: LibrarySetupRequest, LibrarySetupResponse (not needed)

// Update CreateSessionRequest
interface CreateSessionRequest {
  // ... existing fields
  gameMode?: "classic" | "mashup";
  selectedLibraries?: string[];  // Only for mashup mode
}
```

### Phase 2: Utility Function Updates

#### Files to Delete
- `src/shared/utils/categoryGrid.ts` - DELETE (no longer needed)

#### Simple Helper Functions (add to existing utils)
```typescript
// Add to src/shared/utils/session.ts or similar

export const getNextLibraryInRotation = (
  selectedLibraries: string[],
  currentIndex: number
): { nextLibrary: string; nextIndex: number } => {
  const nextIndex = (currentIndex + 1) % selectedLibraries.length;
  return {
    nextLibrary: selectedLibraries[nextIndex],
    nextIndex
  };
};

export const getCurrentLibrary = (
  selectedLibraries: string[],
  currentIndex: number
): string => selectedLibraries[currentIndex];

export const validateLibrarySelection = (libraries: string[]): boolean => {
  return libraries.length >= 2 && libraries.length <= 6;
};
```

### Phase 3: UI Component Updates

#### Session Creation Form Update
```typescript
// Update existing CreateSessionForm component
// Add library selection to session creation (only shown when Mashup mode selected)

export const CreateSessionForm: React.FC = () => {
  const [gameMode, setGameMode] = useState<"classic" | "mashup">("classic");
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);
  const { data: libraries } = usePromptLibraries();

  const handleLibraryToggle = (libraryId: string) => {
    setSelectedLibraries(prev => 
      prev.includes(libraryId) 
        ? prev.filter(id => id !== libraryId)
        : prev.length < 6 ? [...prev, libraryId] : prev
    );
  };

  return (
    <form>
      {/* Existing form fields */}
      
      <div className="game-mode-selector">
        <label>Game Mode</label>
        <select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
          <option value="classic">Classic (Random)</option>
          <option value="mashup">Mashup (Rotate Libraries)</option>
        </select>
      </div>
      
      {gameMode === "mashup" && (
        <div className="library-selector">
          <label>Select Libraries (2-6)</label>
          <div className="library-grid">
            {libraries?.map(library => (
              <LibraryCard
                key={library.id}
                library={library}
                selected={selectedLibraries.includes(library.id)}
                onToggle={() => handleLibraryToggle(library.id)}
                disabled={selectedLibraries.length >= 6 && !selectedLibraries.includes(library.id)}
              />
            ))}
          </div>
          <p className="helper-text">
            {selectedLibraries.length} of 6 selected (minimum 2)
          </p>
        </div>
      )}
      
      {/* Rest of form */}
    </form>
  );
};
```

#### NO OTHER UI CHANGES NEEDED
- All existing phase components work as-is
- No new phase components required
- Library rotation happens automatically in backend

### Phase 4: Constants & Labels Updates

#### Files to Modify
- `src/shared/constants.ts`

#### Changes Required
```typescript
// NO CHANGES to phase constants - Mashup uses same phases as Classic

// Only add game mode labels
export const GAME_MODE_LABELS = {
  classic: "Classic Mode",
  mashup: "Mashup Mode"
};

export const GAME_MODE_DESCRIPTIONS = {
  classic: "Random category selection each round",
  mashup: "Rotate through selected libraries each round"
};

// Optional: Add indicator for current library in Mashup mode
export const getMashupLibraryIndicator = (
  currentLibrary: string,
  libraries: string[],
  currentIndex: number
) => {
  const nextIndex = (currentIndex + 1) % libraries.length;
  return {
    current: currentLibrary,
    next: libraries[nextIndex],
    progress: `${currentIndex + 1}/${libraries.length}`
  };
};
```

### Phase 5: Service Layer Updates

#### Files to Modify
- `src/features/session/sessionService.ts`
- `supabase/functions/sessions-create/index.ts`
- `supabase/functions/sessions-advance-round/index.ts` (or similar)

#### Session Creation Update
```typescript
// Update sessions-create function
export const createSession = async (request: CreateSessionRequest) => {
  const { gameMode = "classic", selectedLibraries, ...sessionData } = request;
  
  // Validate mashup mode libraries
  if (gameMode === "mashup") {
    if (!selectedLibraries || !validateLibrarySelection(selectedLibraries)) {
      throw new Error('Mashup mode requires 2-6 libraries');
    }
  }
  
  const { data: session } = await supabase
    .from('sessions')
    .insert({
      ...sessionData,
      game_mode: gameMode,
      selected_libraries: gameMode === "mashup" ? selectedLibraries : null,
      current_library_index: 0,
      prompt_library_id: gameMode === "mashup" ? selectedLibraries[0] : null
    })
    .select()
    .single();
    
  return session;
};
```

#### Round Advancement Update
```typescript
// Update existing round advancement logic
export const advanceToNextRound = async (sessionId: string) => {
  const { data: session } = await supabase
    .from('sessions')
    .select('game_mode, selected_libraries, current_library_index')
    .eq('id', sessionId)
    .single();
  
  let nextLibraryId: string;
  let nextIndex: number = 0;
  
  if (session.game_mode === "mashup" && session.selected_libraries) {
    // Rotate to next library
    const { nextLibrary, nextIndex: newIndex } = getNextLibraryInRotation(
      session.selected_libraries,
      session.current_library_index || 0
    );
    nextLibraryId = nextLibrary;
    nextIndex = newIndex;
  } else {
    // Classic mode: random selection
    nextLibraryId = selectRandomLibrary();
  }
  
  await supabase
    .from('sessions')
    .update({
      prompt_library_id: nextLibraryId,
      current_library_index: nextIndex,
      status: 'answer'
    })
    .eq('id', sessionId);
};
```

---

## 🗄️ Database Schema Changes

### Sessions Table Update
```sql
-- Remove Jeopardy-specific columns
ALTER TABLE sessions 
DROP COLUMN IF EXISTS category_grid,
DROP COLUMN IF EXISTS selecting_team_id;

-- Add Mashup-specific columns
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS selected_libraries TEXT[],
ADD COLUMN IF NOT EXISTS current_library_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS library_setup_secs INTEGER DEFAULT 30;

-- Update game mode enum
ALTER TABLE sessions 
ADD CONSTRAINT check_game_mode 
CHECK (game_mode IN ('classic', 'mashup'));

-- Add indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_selected_libraries 
ON sessions USING GIN(selected_libraries);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_current_library 
ON sessions(current_library_index);

-- Update existing jeopardy sessions to mashup
UPDATE sessions 
SET game_mode = 'mashup' 
WHERE game_mode = 'jeopardy';
```

### Migration Script
```sql
-- Migration: Convert Jeopardy to Mashup
-- Version: 002_jeopardy_to_mashup

-- Step 1: Backup existing jeopardy data
CREATE TABLE jeopardy_backup AS 
SELECT * FROM sessions WHERE game_mode = 'jeopardy';

-- Step 2: Convert category grid to selected libraries
UPDATE sessions 
SET 
  selected_libraries = (
    SELECT jsonb_array_elements_text(category_grid->'categories'->'id')
  ),
  current_library_index = 0,
  game_mode = 'mashup'
WHERE game_mode = 'jeopardy';

-- Step 3: Clean up old columns
ALTER TABLE sessions 
DROP COLUMN IF EXISTS category_grid,
DROP COLUMN IF EXISTS selecting_team_id;
```

---

## 🎮 Updated User Experience

### Host Workflow

#### Mashup Mode Setup
1. **Create Session** with "Mashup" mode selection
2. **Library Selection Phase** - Choose 3-6 libraries
3. **Rotation Preview** - See the round-robin order
4. **Start Game** - Begin automatic rotation

#### Game Management
1. **Monitor rotation** through current library indicator
2. **Manual override** available to jump to specific library
3. **Add/remove libraries** during game (with confirmation)
4. **Track library usage** statistics

### Player Experience

#### Simplified Interface
- **Clean library rotation display** instead of complex grid
- **Current library indicator** with upcoming preview
- **No complex selection logic** - rotation is automatic
- **Focus on content** rather than strategy

#### Enhanced Gameplay
- **Predictable rotation** - players know what's coming
- **Library variety** - experience different content types
- **Faster gameplay** - no selection phase each round
- **Better flow** - seamless transitions between libraries

---

## 🧪 Testing Strategy

### Unit Tests

#### Library Rotation Functions
```typescript
describe('Library Rotation Utils', () => {
  it('should initialize rotation with selected libraries', () => {
    const libraries = ['popculture', 'sports', 'music'];
    const rotation = initializeLibraryRotation(libraries);
    
    expect(rotation.libraries).toEqual(libraries);
    expect(rotation.currentIndex).toBe(0);
    expect(rotation.rotationOrder).toEqual(libraries);
  });

  it('should get next library in rotation', () => {
    const rotation = initializeLibraryRotation(['a', 'b', 'c']);
    const next = getNextLibrary(rotation);
    
    expect(next.currentIndex).toBe(1);
    expect(next.currentLibrary).toBe('b');
  });

  it('should wrap around to first library', () => {
    const rotation = { 
      libraries: ['a', 'b', 'c'], 
      currentIndex: 2, 
      rotationOrder: ['a', 'b', 'c'] 
    };
    const next = getNextLibrary(rotation);
    
    expect(next.currentIndex).toBe(0);
    expect(next.currentLibrary).toBe('a');
  });
});
```

### Integration Tests

#### End-to-End Mashup Flow
```typescript
describe('Mashup Mode Integration', () => {
  it('should complete full mashup rotation', async () => {
    // Setup mashup session
    const session = await createSession({
      gameMode: "mashup",
      selectedLibraries: ['popculture', 'sports', 'music']
    });
    
    // Complete rotation through all libraries
    for (let i = 0; i < 3; i++) {
      const currentLibrary = getCurrentLibrary(session.rotation);
      expect(['popculture', 'sports', 'music']).toContain(currentLibrary);
      
      await completeRound(session.id);
      session.rotation = getNextLibrary(session.rotation);
    }
    
    // Should be back to start
    expect(session.rotation.currentIndex).toBe(0);
  });
});
```

---

## 📊 Migration Checklist

### Pre-Migration
- [ ] Backup all jeopardy sessions
- [ ] Document current jeopardy usage metrics
- [ ] Prepare rollback plan
- [ ] Communicate changes to users

### Migration Steps
- [ ] Update database schema
- [ ] Deploy backend changes
- [ ] Update frontend components
- [ ] Migrate existing jeopardy sessions
- [ ] Update documentation
- [ ] Test migration results

### Post-Migration
- [ ] Verify all sessions work correctly
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Update training materials
- [ ] Remove deprecated code

---

## 🚀 Deployment Strategy

### Phase 1: Backend Updates
1. Deploy database migration
2. Update API endpoints
3. Add feature flags for gradual rollout

### Phase 2: Frontend Updates
1. Deploy new components
2. Update routing and navigation
3. Test with feature flags enabled

### Phase 3: Full Rollout
1. Enable for all users
2. Monitor performance
3. Remove old jeopardy code

---

## 🔒 Security Considerations

### Library Validation
```typescript
const validateLibrarySelection = async (libraryIds: string[]): Promise<boolean> => {
  // Verify all libraries exist and are accessible
  const libraries = await getLibrariesByIds(libraryIds);
  
  return libraries.length === libraryIds.length && 
         libraryIds.length >= 3 && 
         libraryIds.length <= 6;
};
```

### Rotation Integrity
```typescript
const validateRotationState = (rotation: LibraryRotation): boolean => {
  return rotation.libraries.length > 0 &&
         rotation.currentIndex >= 0 &&
         rotation.currentIndex < rotation.libraries.length &&
         rotation.rotationOrder.length === rotation.libraries.length;
};
```

---

## 📈 Success Metrics

### Adoption Metrics
- **Mashup mode usage**: Target 60% of new sessions
- **Setup completion rate**: Target 95%
- **Session duration**: Target +20% vs classic
- **Library diversity**: Average 4+ libraries per session

### Quality Metrics
- **Rotation accuracy**: 100%
- **Setup time**: <2 minutes average
- **Error rate**: <1% for rotation operations
- **User satisfaction**: 4.5/5 rating

---

## 📝 Maintenance Notes

### Regular Tasks
- [ ] Monitor library rotation performance
- [ ] Track library popularity metrics
- [ ] Update library selection recommendations
- [ ] Review rotation algorithm efficiency

### Monitoring
- **Setup completion rate**
- **Library selection patterns**
- **Rotation speed metrics**
- **Error rates by operation**

---

*This implementation guide provides a complete roadmap for transforming Jeopardy mode into the simplified Mashup mode, focusing on improved user experience and streamlined gameplay.*
