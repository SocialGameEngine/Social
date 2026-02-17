-- Fix remaining foreign key constraints that don't have CASCADE DELETE
-- This prevents similar issues when deleting room memberships or rooms

-- Fix interaction_votes_membership_id_fkey (references room_memberships)
ALTER TABLE interaction_votes DROP CONSTRAINT interaction_votes_membership_id_fkey;
ALTER TABLE interaction_votes 
ADD CONSTRAINT interaction_votes_membership_id_fkey 
FOREIGN KEY (membership_id) 
REFERENCES room_memberships(id) 
ON DELETE CASCADE;

-- Fix interactions_room_id_fkey (references rooms)
ALTER TABLE interactions DROP CONSTRAINT interactions_room_id_fkey;
ALTER TABLE interactions 
ADD CONSTRAINT interactions_room_id_fkey 
FOREIGN KEY (room_id) 
REFERENCES rooms(id) 
ON DELETE CASCADE;
