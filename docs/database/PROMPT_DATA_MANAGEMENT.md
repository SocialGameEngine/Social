# Prompt Data Management

## Overview

This section contains the prompt library data and scripts used for managing the Top Comment game's prompt system.

## Files

### 1. COMPLETE_PROMPT_SEED.sql
**Purpose**: Complete SQL script to populate all 24 prompt libraries with their prompts
**Size**: 218KB
**Usage**: Run in Supabase SQL Editor to seed the database

**Contains**:
- 24 prompt libraries with unique themes
- Complete prompt data for each library
- Proper sorting and activation settings

**Libraries Included**:
- Classic Crowd 🔥
- Modern Day Dangerfield 👨
- Bar Banter 🍻
- Basic Prompts ✨
- Spooky Season 🎃
- Selfie Stars 📸
- Victoria Nights 🌊
- Medieval Mayhem ⚔️
- Anime Antics 🍜
- Political Roasts 🏛️
- Sci-Fi Shenanigans 🚀
- Pop Culture Chaos ⭐
- Cinema Snark 🎬
- Canucks Chaos 🏒
- BC Vibes 🌲
- Tech & AI Slop 💻
- Internet Culture 📱
- Dating App Disasters 💔
- Remote Work Reality 💼
- Adulting Fails 🎓
- Group Chat Chaos 💬
- Streaming Wars 📺
- Climate Anxiety 🌍
- Fictional Worlds 🎭

### 2. prompt_data.json
**Purpose**: JSON source data for all prompt libraries
**Size**: 73KB
**Usage**: Source file for generating SQL scripts

**Structure**:
```json
[
  {
    "id": "classic",
    "name": "Classic Crowd",
    "emoji": "🔥",
    "description": "Lighthearted pop-culture roasts for any crowd.",
    "prompts": [
      "What would you say if an alien landed in your backyard?",
      "What is the quickest way to get fired from your job?",
      // ... more prompts
    ]
  }
  // ... more libraries
]
```

### 3. generate_prompt_sql.py
**Purpose**: Python script to convert JSON data to SQL format
**Size**: 11KB
**Usage**: Generate updated SQL scripts from JSON data

**Functionality**:
- Reads `prompt_data.json`
- Generates properly formatted SQL
- Handles special characters and escaping
- Creates complete seed script

## Usage Instructions

### Seeding the Database
1. Open Supabase SQL Editor
2. Copy contents of `COMPLETE_PROMPT_SEED.sql`
3. Execute the script
4. Verify all 24 libraries are created

### Updating Prompts
1. Edit `prompt_data.json` with new prompts
2. Run `generate_prompt_sql.py` to create new SQL
3. Test the generated SQL script
4. Update `COMPLETE_PROMPT_SEED.sql` if needed

### Adding New Libraries
1. Add new library object to `prompt_data.json`
2. Include prompts array with at least 10 prompts
3. Regenerate SQL using the Python script
4. Test and deploy

## Data Structure

### Prompt Library Schema
```sql
CREATE TABLE prompt_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Prompt Schema
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID REFERENCES prompt_libraries(id),
  text TEXT NOT NULL,
  category TEXT,
  difficulty_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

## Quality Standards

### Prompt Requirements
- **Length**: 20-100 characters optimal
- **Tone**: Appropriate for bar environment
- **Engagement**: Encourage creative responses
- **Variety**: Mix of topics within each library

### Library Standards
- **Prompt Count**: 15-25 prompts per library
- **Theme Consistency**: All prompts match library theme
- **Difficulty Balance**: Mix of easy and challenging prompts
- **Cultural Relevance**: Timely and relatable content

## Maintenance

### Regular Updates
- Review prompt performance monthly
- Remove underperforming prompts
- Add seasonal prompts for holidays
- Update political/current event prompts

### Quality Assurance
- Test new prompts in development
- Check for inappropriate content
- Verify proper categorization
- Ensure consistent formatting

---

*Last updated: January 2026*
