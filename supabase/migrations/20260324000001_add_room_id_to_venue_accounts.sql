-- Add room_id column to venue_accounts table
-- This migration adds the missing room_id column that connects venue accounts to rooms

ALTER TABLE venue_accounts ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_venue_accounts_room_id ON venue_accounts(room_id) WHERE room_id IS NOT NULL;
