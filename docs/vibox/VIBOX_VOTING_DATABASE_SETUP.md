# VIBox Voting System Database Setup

## Overview
This document outlines the database setup for the VIBox voting system that allows users to vote on tracks with session and player tracking.

## Database Tables

### `vibex_votes`
Main table storing individual votes with full tracking.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier for each vote
- `track_id` (TEXT, NOT NULL) - ID of the track being voted on
- `session_id` (TEXT, NOT NULL) - Session ID of the voter
- `player_id` (TEXT, Optional) - Player ID (if available)
- `vote_type` (TEXT, NOT NULL) - 'up' or 'down' vote
- `created_at` (TIMESTAMP) - When the vote was created
- `updated_at` (TIMESTAMP) - When the vote was last updated

**Constraints:**
- Unique constraint on `(track_id, session_id)` - One vote per track per session
- Check constraint on `vote_type` - Must be 'up' or 'down'

### Views

#### `vibex_vote_counts`
Aggregated view showing vote counts for each track.

**Columns:**
- `track_id` - Track ID
- `upvotes` - Number of upvotes
- `downvotes` - Number of downvotes  
- `total_votes` - Total number of votes
- `net_votes` - Upvotes minus downvotes
- `last_voted_at` - When this track was last voted on

#### `vibex_latest_user_votes`
View showing each user's latest vote on each track.

**Columns:**
- `track_id` - Track ID
- `session_id` - Session ID
- `player_id` - Player ID
- `vote_type` - 'up' or 'down'
- `created_at` - Vote creation time
- `updated_at` - Vote update time

## Setup Instructions

### 1. Run the Migration
Execute the SQL migration file:
```sql
-- Run this in your Supabase SQL editor
\i database/20260118020000_create_vibex_votes_table.sql
```

### 2. Run the Functions
The migration includes the functions, but you can also run them separately:
```sql
-- Run this in your Supabase SQL editor
\i database/vibex_voting_functions.sql
```

### 3. Verify Setup
Check that tables, views, and functions were created:
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'vibex_votes';

-- Check views exist
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE 'vibex_%';

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%vibex%';

-- Test the functions
SELECT * FROM get_vote_counts_from_db() LIMIT 5;
SELECT * FROM get_user_votes_from_db('your_session_id') LIMIT 5;
```

## Security (RLS)

The voting system uses Row Level Security (RLS) with these policies:

- **View Policy**: All users can view all votes (for real-time updates)
- **Insert Policy**: Users can insert their own votes (matched by session_id)
- **Update Policy**: Users can update their own votes
- **Delete Policy**: Users can delete their own votes

## Usage in Application

### React Context
The voting system uses a React context (`ViboxVotingContext`) that provides:

```typescript
const { 
  voteCounts,      // Map of track_id -> VoteCounts
  userVotes,       // Map of track_id -> UserVote
  handleVote,      // Function to vote on a track
  getVoteCount,    // Get vote count for a track
  getUserVote,     // Get user's vote for a track
  isLoading,       // Loading state
  error           // Error state
} = useVoting();
```

### Session Tracking
Votes are tracked by session ID using the `getSessionId()` utility. If you have player identification, you can uncomment and implement the `player_id` field.

## Real-time Updates

The system uses Supabase Realtime for instant vote synchronization:

1. When a user votes, the change is broadcast to all connected clients
2. Vote counts update in real-time across all devices
3. User vote states are maintained locally for immediate UI feedback

## Performance Considerations

- **Indexes**: Created on `track_id`, `session_id`, `player_id`, and `created_at`
- **Views**: Pre-aggregated views for fast vote count queries
- **RLS**: Efficient row-level security policies
- **Realtime**: Optimized broadcast channel for vote updates

## Data Privacy

- Votes are associated with session IDs, not personal identifiers
- Player ID is optional and can be used for additional tracking
- All vote data is stored securely with RLS policies

## Future Enhancements

Potential improvements:
- Vote rate limiting per session
- Vote history tracking
- Anonymous voting options
- Vote weighting based on user roles
- Vote analytics and reporting
