# Prompt Library Migration Instructions

## Summary

All prompt libraries have been successfully prepared for migration to Supabase:

- ✅ **17 new prompt libraries** created with 50 prompts each
- ✅ **2 existing libraries** updated (classic, basic)
- ✅ **SQL migration file** generated at `supabase/migrations/20260108000000_add_new_prompt_libraries.sql`
- ✅ **TypeScript imports** updated in `src/shared/promptLibraries.ts`
- ✅ **Metadata file** updated in `src/shared/promptLibraries.meta.json`

## New Prompt Libraries

1. **Medieval Mayhem** ⚔️ - Knights, castles, and medieval chaos
2. **Anime Antics** 🍜 - Slice-of-life and shonen-themed prompts
3. **Political Roasts** 🏛️ - Global politics satire
4. **Sci-Fi Shenanigans** 🚀 - Space stations and futuristic fails
5. **Pop Culture Chaos** ⭐ - Celebrity drama and entertainment roasts
6. **Cinema Snark** 🎬 - Movie industry humor
7. **Canucks Chaos** 🏒 - Vancouver Canucks memes
8. **BC Vibes** 🌲 - British Columbia culture
9. **Tech & AI Slop** 💻 - Modern tech and AI fails
10. **Internet Culture** 📱 - Viral memes and social media
11. **Dating App Disasters** 💔 - Modern dating fails
12. **Remote Work Reality** 💼 - Zoom fails and WFH struggles
13. **Adulting Fails** 🎓 - Taxes and responsibilities
14. **Group Chat Chaos** 💬 - Wrong messages and chat drama
15. **Streaming Wars** 📺 - Subscription and binge culture
16. **Climate Anxiety** 🌍 - Eco-guilt and sustainability
17. **Fictional Worlds** 🎭 - Dark humor about popular franchises

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/dtudipmqfrknkrsahlst
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20260108000000_add_new_prompt_libraries.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Supabase CLI (Local Development)

If you have Supabase running locally:

```bash
cd a:\Social\Social
pnpm supabase db reset  # Reset local database (optional)
pnpm supabase migration up  # Apply all pending migrations
```

### Option 3: Push to Remote

If you want to apply to your remote Supabase instance via CLI:

```bash
cd a:\Social\Social
pnpm supabase link --project-ref dtudipmqfrknkrsahlst
pnpm supabase db push
```

## Verification

After running the migration, verify it worked:

1. **Check prompt_libraries table:**
   ```sql
   SELECT id, name, emoji FROM prompt_libraries ORDER BY sort_order;
   ```
   Should return 24 libraries total (7 existing + 17 new)

2. **Check prompts count:**
   ```sql
   SELECT library_id, COUNT(*) as prompt_count 
   FROM prompts 
   GROUP BY library_id 
   ORDER BY library_id;
   ```

3. **Test in your app:**
   - The app should automatically pick up the new libraries
   - All imports are already configured in `promptLibraries.ts`
   - Metadata is ready in `promptLibraries.meta.json`

## Files Modified

### Created:
- `supabase/migrations/20260108000000_add_new_prompt_libraries.sql`
- `scripts/generate-prompt-migration.js`
- `apps/event-platform/src/shared/datingAppPrompts.json`
- `apps/event-platform/src/shared/remoteWorkPrompts.json`
- `apps/event-platform/src/shared/adultingPrompts.json`
- `apps/event-platform/src/shared/groupChatPrompts.json`
- `apps/event-platform/src/shared/streamingPrompts.json`
- `apps/event-platform/src/shared/climateAnxietyPrompts.json`
- `apps/event-platform/src/shared/fictionalWorldsPrompts.json`

### Updated:
- `apps/event-platform/src/shared/promptLibraries.ts` - Added all new imports
- `apps/event-platform/src/shared/promptLibraries.meta.json` - Added all new library metadata
- `apps/event-platform/src/shared/prompts.json` - Updated classic prompts
- `apps/event-platform/src/shared/basicprompts.json` - Updated basic prompts
- `apps/event-platform/src/shared/halloweenPrompts.json` - Removed side notes
- `apps/event-platform/src/shared/victoriaPrompts.json` - Kept good structures
- `apps/event-platform/src/shared/barPrompts.json` - Removed side notes
- `apps/event-platform/src/shared/selfiePrompts.json` - Removed side notes

### Previously Created (from earlier session):
- `apps/event-platform/src/shared/medievalPrompts.json`
- `apps/event-platform/src/shared/animePrompts.json`
- `apps/event-platform/src/shared/politicsPrompts.json`
- `apps/event-platform/src/shared/scifiPrompts.json`
- `apps/event-platform/src/shared/popCulturePrompts.json`
- `apps/event-platform/src/shared/cinemaPrompts.json`
- `apps/event-platform/src/shared/canucksPrompts.json`
- `apps/event-platform/src/shared/bcPrompts.json`
- `apps/event-platform/src/shared/techPrompts.json`
- `apps/event-platform/src/shared/internetCulturePrompts.json`

## Notes

- All prompts follow the PROMPT_WRITING_GUIDE.md criteria
- Side notes have been removed from all prompts
- Action verbs (Describe/Invent/How/Pitch) are used strategically
- All new libraries target Gen Z and Millennials
- Each library has 50+ prompts for variety
