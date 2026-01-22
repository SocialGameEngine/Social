# Prompt Admin Tool

A simple admin interface for managing prompt libraries directly in the database.

## Setup

1. Make sure your `Social/.env.local` file contains:
   ```
   VITE_SUPABASE_URL=https://dtudipmqfrknkrsahlst.supabase.co
   VITE_SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```

2. Get your service role key from: https://supabase.com/dashboard/project/dtudipmqfrknkrsahlst/settings/api
   - Copy the **"service_role"** key (NOT the anon key)
   - Replace `your_service_role_key_here` with the actual key

3. Start the tool:
   ```bash
   cd Social
   pnpm --filter @social/prompt-admin dev
   ```

4. Open http://localhost:3004/

## Features

- Create, edit, delete prompt libraries
- Add, edit, delete, reorder prompts
- Search and filter prompts
- Bulk import/export to JSON
- Direct database access (no authentication required)