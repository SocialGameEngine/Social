# Type Assertions Registry

This document tracks all `as any` type assertions used in the codebase. These are temporary workarounds for missing database table types in the shared Supabase client.

## Purpose
These type assertions are necessary because:
1. The Supabase client comes from a shared package `@social/db` 
2. The shared client doesn't include types for newly created tables
3. Generated types exist locally but aren't applied to the shared client
4. Functionality works correctly at runtime, just needs type safety

## Files with Type Assertions

### 1. `src/services/interactionService.ts`

**Lines:** 434, 445, 447, 454, 476, 568, 583-588, 598, 605, 609

**Tables needing proper types:**
- `topic_upvotes` - New table for topic response upvotes
- `poll_votes` - New table for poll voting

**Specific assertions:**
```typescript
// Line 434: Check if upvote exists
.from('topic_upvotes' as any)

// Line 445: Remove upvote
.from('topic_upvotes' as any)

// Line 447: Access upvote id
.eq('id', (existing as any).id)

// Line 454: Add upvote
.from('topic_upvotes' as any)

// Line 476: Get upvotes for responses
.from('topic_upvotes' as any)

// Line 568: Submit poll vote
.from('poll_votes' as any)

// Lines 583-588: Map poll vote response
id: (data as any).id,
interactionId: (data as any).interaction_id,
membershipId: (data as any).membership_id,
selectedOption: (data as any).selected_option,
createdAt: (data as any).created_at,
updatedAt: (data as any).updated_at,

// Line 598: Get poll options from interaction
.from('interactions')

// Line 605: Access poll_options
((interactionData as any).poll_options || [])

// Line 609: Get poll votes
.from('poll_votes' as any)
```

### 2. `src/hooks/useCommunityPosts.ts`

**Lines:** 164, 173, 180, 186, 206, 237, 252-264, 314, 349, 367-377, 386, 395, 402, 442, 454-466

**Tables needing proper types:**
- `community_posts` - Community feature posts table
- `post_likes` - Community post likes table  
- `post_replies` - Community post replies table
- `reply_likes` - Community reply likes table
- `post_embeds` - Community post embeds table

**Specific assertions:**
```typescript
// Line 164: Check if post liked
.from('post_likes' as any)

// Line 173: Unlike post
.from('post_likes' as any)

// Line 180: Like post
.from('post_likes' as any)

// Line 186: Access existing like id
(data as any).id

// Line 206: Delete post
.from('community_posts' as any)

// Line 237: Get post with relations
.from('community_posts' as any)

// Lines 252-264: Map community post response
id: (data as any).id,
room_id: (data as any).room_id,
membership_id: (data as any).membership_id,
content: (data as any).content,
likes: (data as any).likes || 0,
reply_count: (data as any).reply_count || 0,
created_at: (data as any).created_at,
updated_at: (data as any).updated_at,
is_deleted: (data as any).is_deleted || false,
author_name: (data as any).room_memberships?.player_name || 'Anonymous',
author_avatar: (data as any).room_memberships?.user_metadata?.avatar_url,
embeds: (data as any).post_embeds || [],
user_liked: (data as any).post_likes?.some((like: any) => like.membership_id === membershipId) || false

// Line 314: Fetch replies
.from('post_replies' as any)

// Line 349: Create reply
.from('post_replies' as any)

// Lines 367-377: Map reply response
id: (data as any).id,
post_id: (data as any).post_id,
membership_id: (data as any).membership_id,
content: (data as any).content,
likes: (data as any).likes || 0,
created_at: (data as any).created_at,
updated_at: (data as any).updated_at,
is_deleted: (data as any).is_deleted || false,
author_name: (data as any).room_memberships?.player_name || 'Anonymous',
author_avatar: (data as any).room_memberships?.user_metadata?.avatar_url,
user_liked: false

// Line 386: Check if reply liked
.from('reply_likes' as any)

// Line 395: Unlike reply
.from('reply_likes' as any)

// Line 402: Like reply
.from('reply_likes' as any)

// Line 442: Get reply for real-time
.from('post_replies' as any)

// Lines 454-466: Map real-time reply
id: (data as any).id,
post_id: (data as any).post_id,
membership_id: (data as any).membership_id,
content: (data as any).content,
likes: (data as any).likes || 0,
created_at: (data as any).created_at,
updated_at: (data as any).updated_at,
is_deleted: (data as any).is_deleted || false,
author_name: (data as any).room_memberships?.player_name || 'Anonymous',
author_avatar: (data as any).room_memberships?.user_metadata?.avatar_url,
user_liked: false
```

### 3. `src/hooks/useCommunityPosts.ts` (continued)

**Lines:** 65, 118, 132, 142

**Additional assertions:**
```typescript
// Line 65: Fetch posts
.from('community_posts' as any)

// Line 118: Create post
.from('community_posts' as any)

// Line 132: Access post id for embeds
post_id: (postData as any).id,

// Line 142: Insert embeds
.from('post_embeds' as any)
```

## How to Fix These

### Option 1: Update Shared Package
1. Update the `@social/db` package to include the new table types
2. Regenerate types in the shared package
3. Remove all `as any` assertions

### Option 2: Local Type Extension
1. Create a local typed Supabase client that extends the shared client
2. Apply the generated Database types to the local client
3. Replace `as any` with proper typing

### Option 3: Type Assertion Functions
1. Create helper functions that properly type the database operations
2. Replace direct `as any` with these typed helpers

## Priority for Fixes

### High Priority (Core Features)
- `topic_upvotes` - Essential for Topics feature
- `poll_votes` - Essential for Polls feature

### Medium Priority (Community Features)
- `community_posts` - Community posts functionality
- `post_likes` - Community post likes
- `post_replies` - Community replies

### Low Priority (Supporting Features)
- `reply_likes` - Reply likes
- `post_embeds` - Post embeds

## Impact Assessment

### Current State
- ✅ All functionality works correctly at runtime
- ✅ Build compiles successfully
- ⚠️ Type safety is compromised
- ⚠️ IDE autocomplete is reduced

### After Fix
- ✅ Full type safety
- ✅ Better IDE support
- ✅ Easier maintenance
- ✅ Better error catching

## Notes
- The `as any` assertions are carefully targeted to only the problematic table access
- All existing functionality continues to work
- The generated types in `src/supabase/types.ts` are correct and complete
- The issue is purely a type system limitation due to the shared Supabase client
