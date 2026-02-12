-- Revert CASCADE DELETE to use application-level cleanup instead
-- This gives us better control over data deletion and prevents accidental data loss

-- Revert interaction_votes_membership_id_fkey back to no CASCADE
ALTER TABLE interaction_votes DROP CONSTRAINT interaction_votes_membership_id_fkey;
ALTER TABLE interaction_votes 
ADD CONSTRAINT interaction_votes_membership_id_fkey 
FOREIGN KEY (membership_id) 
REFERENCES room_memberships(id);

-- Revert interactions_room_id_fkey back to no CASCADE  
ALTER TABLE interactions DROP CONSTRAINT interactions_room_id_fkey;
ALTER TABLE interactions 
ADD CONSTRAINT interactions_room_id_fkey 
FOREIGN KEY (room_id) 
REFERENCES rooms(id);

-- Revert responses_membership_id_fkey back to no CASCADE
ALTER TABLE responses DROP CONSTRAINT responses_membership_id_fkey;
ALTER TABLE responses 
ADD CONSTRAINT responses_membership_id_fkey 
FOREIGN KEY (membership_id) 
REFERENCES room_memberships(id);
