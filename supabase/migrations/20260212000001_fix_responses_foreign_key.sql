-- Fix the responses foreign key to use CASCADE DELETE
-- This allows room_memberships to be deleted and automatically clean up responses

-- First drop the existing foreign key constraint
ALTER TABLE responses DROP CONSTRAINT responses_membership_id_fkey;

-- Re-add it with CASCADE DELETE
ALTER TABLE responses 
ADD CONSTRAINT responses_membership_id_fkey 
FOREIGN KEY (membership_id) 
REFERENCES room_memberships(id) 
ON DELETE CASCADE;
