# Prompt Writing Guide

## Purpose
This guide helps create high-quality prompts for interactive party games where players submit creative, funny responses. The goal is to encourage entertaining, original answers that spark conversation and laughter.

---

## Core Criteria for Good Prompts

### ✅ 1. Encourage Creative Responses
- **DO:** Ask players to create scenarios, descriptions, or explanations
- **DON'T:** Ask for single-word answers or just names
- **Example:**
  - ❌ "A celebrity who got canceled"
  - ✅ "A ridiculous reason to get canceled online"

### ✅ 2. Avoid "Name That Thing" Format
- **DO:** Focus on behaviors, concepts, and hypotheticals
- **DON'T:** Ask "Which...", "Who...", or "What movie/song/person..." when it leads to single-word answers
- **Note:** "Describe...", "Invent...", "How would you..." are GOOD when they encourage creative descriptions
- **Example:**
  - ❌ "Name the worst movie sequel"
  - ✅ "The worst movie sequel title"
  - ✅ "Describe the ultimate nightmare scenario"
  - ✅ "Invent a totally fake species"
  - ✅ "How would you ruin this in one move?"

### ✅ 3. No Side Notes or Hints
- **DO:** Let players come up with their own answers
- **DON'T:** Include parenthetical suggestions or hints
- **Example:**
  - ❌ "What you're actually bidding on (it's a parking spot)"
  - ✅ "What you're actually bidding on in Vancouver"

### ✅ 4. Universally Relatable
- **DO:** Make prompts answerable by most people
- **DON'T:** Require specialized knowledge or niche references
- **Example:**
  - ❌ "The worst thing about quantum computing"
  - ✅ "The worst thing about software updates"

### ✅ 5. Clear and Concise
- **DO:** Get to the point quickly
- **DON'T:** Use overly complex or confusing phrasing
- **Example:**
  - ❌ "In the hypothetical scenario where you were to encounter..."
  - ✅ "The worst thing to hear from..."

### ✅ 6. Encourage Humor
- **DO:** Use words like "worst," "terrible," "ridiculous," "horrible"
- **DON'T:** Be too serious or academic
- **Example:**
  - ❌ "Describe a challenging situation at work"
  - ✅ "The worst thing to say during a job interview"

### ✅ 7. Open-Ended
- **DO:** Allow multiple valid answers
- **DON'T:** Have a single "correct" response
- **Example:**
  - ❌ "What year did the Titanic sink?"
  - ✅ "Why did the Titanic REALLY sink?"

### ✅ 8. Contextually Appropriate
- **DO:** Fit the theme of the prompt pack
- **DON'T:** Mix themes inappropriately
- **Example:**
  - ❌ Medieval pack: "Your favorite smartphone app"
  - ✅ Medieval pack: "A terrible name for a medieval guild"

### ✅ 9. Avoid Repetition
- **DO:** Vary language and structure throughout the pack
- **DON'T:** Overuse the same keywords or patterns
- **Example:**
  - ❌ Having 10 prompts that all start with "The worst thing about..."
  - ✅ Mix it up: "The worst...", "A terrible...", "Your theory on...", "What really..."

### ✅ 10. Invite Storytelling
- **DO:** Use prompts that encourage narrative responses
- **DON'T:** Limit to simple descriptions
- **Example:**
  - ❌ "A bad restaurant"
  - ✅ "What really happens in the kitchen after closing time"

### ✅ 11. Balance Specificity and Flexibility
- **DO:** Give direction while allowing creativity
- **DON'T:** Be too vague or too restrictive
- **Example:**
  - ❌ "Something bad" (too vague)
  - ❌ "The exact words spoken by the CEO of Tesla on March 15, 2023" (too specific)
  - ✅ "The worst thing a tech CEO could tweet"

### ✅ 12. Avoid Dated References
- **DO:** Focus on timeless patterns and behaviors
- **DON'T:** Rely on specific current events
- **Example:**
  - ❌ "Your take on the 2024 election results"
  - ✅ "The worst campaign slogan ever"

---

## Prompt Structures That Work Well

### Fill-in-the-Blank Prompts
Fill-in-the-blank prompts are excellent for encouraging creative responses. They provide structure while allowing freedom.

**Best Practices:**
- Use "___" or "__________" to indicate the blank
- Set up the context before the blank
- Make the blank the punchline or key creative element
- Works great for comedic setups

**Examples:**
- "I get no respect. Even my phone auto-corrects me to ___."
- "My therapist said I need better coping skills, so now I just ___."
- "As Shakespeare once said, __________"
- "This just in: __________"
- "Disney is replacing Iron Man with __________"

**When to Use:**
- Comedy/joke-style prompts
- Completing sentences or thoughts
- Creating unexpected twists
- Rodney Dangerfield-style self-deprecating humor

### Theory/Explanation Prompts
- "Your theory on why..."
- "The real reason..."
- "What really happened when..."

### Hypothetical Scenarios
- "The worst way to..."
- "A terrible excuse for..."
- "A horrible name for..."

### Comparison Prompts
- "What you expected vs what you got"
- "What they say vs what they mean"
- "What tourists think vs what locals know"

### Creative Description Prompts
- "A ridiculous..."
- "The most embarrassing..."
- "The most useless..."

### Opinion/Take Prompts
- "Your honest take on..."
- "Your breaking point with..."
- "Your conspiracy theory about..."

### Action/Instruction Prompts
- "Describe..." (when asking for creative description)
- "Invent..." (when asking for creative invention)
- "How would you..." (when asking for creative method)
- "Pitch..." (when asking for creative pitch)

**When to Use Action Verbs:**
- ✅ You want to emphasize the creative process
- ✅ The prompt might be ambiguous without it
- ✅ You're asking for a method or strategy
- ✅ You want players to elaborate beyond just the answer

**Examples:**
- ✅ "Describe the ultimate Malahat Drive nightmare" (signals you want detail)
- ✅ "Invent a totally fake Vancouver Island whale species" (clear it's made up)
- ✅ "How would you ruin Empress High Tea in one move?" (asks for method)
- ✅ "Pitch a new reality show that would get canceled immediately" (wants concept + description)

**When to Keep It Simple:**
- ✅ The prompt already clearly asks for creative output
- ✅ Adding the verb makes it wordier without adding clarity
- ✅ The format is already an instruction
- ✅ You're just asking for the final result (a name, a title, etc.)

**Examples:**
- ✅ "Change one word in a movie title to ruin it" (already an instruction)
- ✅ "An honest Yelp review of Hell" (already implies writing)
- ✅ "A terrible name for a medieval tavern" (just asking for the name)

**Key Question:** Does the action verb add clarity or just words?

---

## Database Migration

### Overview

Prompts are stored in two places:
1. **JSON files** in `src/shared/` for local development and imports
2. **Supabase database** tables for production use

### Database Schema

**prompt_libraries table:**
```sql
id TEXT PRIMARY KEY              -- Library identifier (e.g., 'medieval')
name TEXT NOT NULL               -- Display name (e.g., 'Medieval Mayhem')
emoji TEXT NOT NULL              -- Emoji icon (e.g., '⚔️')
description TEXT NOT NULL        -- Short description
is_active BOOLEAN DEFAULT true   -- Whether library is available
sort_order INTEGER DEFAULT 0     -- Display order
created_at TIMESTAMPTZ           -- Creation timestamp
updated_at TIMESTAMPTZ           -- Last update timestamp
```

**prompts table:**
```sql
id UUID PRIMARY KEY              -- Auto-generated prompt ID
library_id TEXT                  -- References prompt_libraries(id)
text TEXT NOT NULL               -- The actual prompt text
variant TEXT                     -- For A/B testing (optional)
is_active BOOLEAN DEFAULT true   -- Whether prompt is available
sort_order INTEGER DEFAULT 0     -- Order within library
created_at TIMESTAMPTZ           -- Creation timestamp
updated_at TIMESTAMPTZ           -- Last update timestamp
times_shown INTEGER DEFAULT 0    -- Analytics: times displayed
times_answered INTEGER DEFAULT 0 -- Analytics: times answered
avg_answer_time_ms INTEGER       -- Analytics: average response time
thumbs_up_count INTEGER DEFAULT 0    -- Analytics: positive feedback
thumbs_down_count INTEGER DEFAULT 0  -- Analytics: negative feedback
```

### Enhanced JSON Structure (Optional)

While simple JSON arrays work fine, you can use an enhanced structure for better metadata:

```json
{
  "library": {
    "id": "medieval",
    "name": "Medieval Mayhem",
    "emoji": "⚔️",
    "description": "Knights, castles, and medieval chaos for history buffs.",
    "sortOrder": 8
  },
  "prompts": [
    {
      "text": "The worst thing a knight could yell before charging into battle",
      "variant": null,
      "sortOrder": 1
    },
    {
      "text": "A terrible name for a medieval tavern",
      "variant": null,
      "sortOrder": 2
    }
  ]
}
```

**Note:** The current system uses simple arrays for simplicity. Enhanced structure is optional.

### Migration Process

#### Step 1: Create Your Prompt JSON File

Create a new file in `src/shared/` (e.g., `myNewPrompts.json`):

```json
[
  "Your first prompt here",
  "Your second prompt here",
  "Your third prompt here"
]
```

#### Step 2: Add Library Metadata

Update `src/shared/promptLibraries.meta.json`:

```json
{
  "id": "mynew",
  "name": "My New Pack",
  "emoji": "🎯",
  "description": "Description of your prompt pack.",
  "promptFile": "myNewPrompts.json"
}
```

#### Step 3: Add TypeScript Import

Update `src/shared/promptLibraries.ts`:

```typescript
import myNewPrompts from "./myNewPrompts.json";

const promptFileMap: Record<string, string[]> = {
  // ... existing imports
  "myNewPrompts.json": myNewPrompts,
};
```

#### Step 4: Generate SQL Migration

Run the migration generator script:

```bash
node scripts/generate-prompt-migration.js
```

This creates a SQL file at `supabase/migrations/[timestamp]_add_new_prompt_libraries.sql`

#### Step 5: Apply to Database

**Option A: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the generated SQL migration
4. Paste and click **Run**

**Option B: Supabase CLI**
```bash
pnpm supabase db push
```

### Migration Script Details

The `generate-prompt-migration.js` script:
- Reads all JSON files from `src/shared/`
- Generates SQL INSERT statements
- Handles SQL escaping (single quotes, etc.)
- Creates both library and prompt records
- Supports updating existing libraries

### Updating Existing Libraries

To update prompts in an existing library:

1. Edit the JSON file
2. Regenerate migration with the script
3. The script will generate DELETE + INSERT statements
4. Apply the migration to database

**Example migration output:**
```sql
-- Delete old prompts
DELETE FROM prompts WHERE library_id = 'medieval';

-- Insert updated prompts
INSERT INTO prompts (library_id, text, sort_order) VALUES
  ('medieval', 'Updated prompt 1', 1),
  ('medieval', 'Updated prompt 2', 2);
```

### Best Practices

1. **Always test locally first** - Run migrations on local Supabase before production
2. **Version control** - Commit both JSON files and SQL migrations
3. **Backup before updates** - Back up existing prompts before DELETE operations
4. **Use sort_order** - Maintain consistent ordering across JSON and database
5. **Validate SQL** - Check generated SQL for proper escaping
6. **Test in app** - Verify prompts load correctly after migration

### Troubleshooting

**Issue: Prompts not showing in app**
- Check `is_active = true` in database
- Verify library_id matches in both tables
- Confirm TypeScript imports are correct

**Issue: SQL syntax errors**
- Check for unescaped single quotes in prompts
- Verify the migration script escaped them properly
- Manually fix if needed: `'` becomes `''`

**Issue: Duplicate prompts**
- DELETE old prompts before INSERT
- Or use `ON CONFLICT` clauses
- Check sort_order for uniqueness

---

## Common Mistakes to Avoid

### ❌ Too Specific
"Name the 2011 Vancouver Canucks player who scored in Game 7"

### ❌ Requires Specialized Knowledge
"The worst quantum entanglement experiment"

### ❌ Has a Factual Answer
"What is the capital of France?"

### ❌ Too Vague
"Something"

### ❌ Includes Hints
"The worst thing at a bar (it's the bathroom)"

### ❌ Just Asks for Names
"A canceled celebrity"

### ❌ Too Serious
"Discuss the socioeconomic implications of..."

### ❌ Dated Reference
"Your take on the Fyre Festival" (unless in a specific historical pack)

---

## Themed Pack Guidelines

### When Creating a Themed Pack:
1. **Stay on theme** - Every prompt should clearly relate to the pack's topic
2. **Vary the angles** - Approach the theme from different perspectives
3. **Mix prompt types** - Use different structures throughout
4. **Consider the audience** - Ensure most people can engage with the theme
5. **Aim for 50 prompts** - This provides good variety without repetition

### Example Themes That Work:
- Location-specific (Vancouver, BC, Victoria)
- Activity-based (Bar, Selfies)
- Genre/Setting (Medieval, Sci-Fi, Anime)
- Cultural phenomena (Internet Culture, Pop Culture, Tech)
- Sports teams (Canucks)
- Seasonal/Event (Halloween)

---

## Quality Check Before Finalizing

Before submitting a prompt pack, ask:
1. ✅ Can most people answer these without googling?
2. ✅ Will answers be funny/creative rather than factual?
3. ✅ Are there no hints or side notes in parentheses?
4. ✅ Is each prompt unique and not repetitive?
5. ✅ Does each prompt encourage more than a one-word answer?
6. ✅ Are the prompts varied in structure and wording?
7. ✅ Do all prompts fit the pack's theme?
8. ✅ Are prompts timeless rather than tied to specific events?

---

## JSON Format

All prompt packs should be saved as JSON arrays:

```json
[
  "First prompt here",
  "Second prompt here",
  "Third prompt here"
]
```

- No trailing comma after the last prompt
- Use double quotes
- Each prompt is a string
- File naming: `themePrompts.json` (camelCase)

---

## Examples of Good vs Bad Prompts

| Bad Prompt | Why It's Bad | Good Prompt |
|------------|--------------|-------------|
| "A celebrity who got canceled" | Just asks for a name | "A ridiculous reason to get canceled online" |
| "The worst movie (it's Cats)" | Includes a hint | "The worst movie musical concept" |
| "Name a Vancouver restaurant" | Just asks for a name | "What the restaurant menu doesn't tell you" |
| "The capital of BC" | Factual answer | "Why Victoria keeps pretending it's not really Canada" |
| "Something bad" | Too vague | "The worst thing to hear from your dentist" |
| "Your take on the 2023 incident" | Dated reference | "The worst thing to go viral" |

---

## Final Notes

- **Trust the players** - They're creative and funny. Don't over-explain.
- **Test your prompts** - Read them aloud. Do they spark ideas immediately?
- **Iterate** - If a prompt feels flat, rework it.
- **Have fun** - If you're not entertained writing them, players won't be entertained answering them.

Remember: The best prompts make people laugh before they even answer them.
