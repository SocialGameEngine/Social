const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and service role key
const supabaseUrl = 'https://dtudipmqfrknkrsahlst.supabase.co';
const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY'; // You'll need to get this from Supabase dashboard

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  try {
    console.log('Applying headline fibbage migration...');
    
    // Update type constraint
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.interactions 
          DROP CONSTRAINT IF EXISTS interactions_type_check,
          ADD CONSTRAINT interactions_type_check 
            CHECK (type IN ('prompt', 'headline_fibbage'));
      `
    });
    
    // Update status constraint
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.interactions 
          DROP CONSTRAINT IF EXISTS interactions_status_check,
          ADD CONSTRAINT interactions_status_check 
            CHECK (status IN ('active', 'voting', 'results', 'closed'));
      `
    });
    
    // Add new columns
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.interactions 
          ADD COLUMN IF NOT EXISTS answer_seconds integer,
          ADD COLUMN IF NOT EXISTS answer_ends_at timestamptz,
          ADD COLUMN IF NOT EXISTS voting_seconds integer,
          ADD COLUMN IF NOT EXISTS voting_ends_at timestamptz,
          ADD COLUMN IF NOT EXISTS vote_count integer DEFAULT 0;
      `
    });
    
    console.log('Migration applied successfully!');
    
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration();
