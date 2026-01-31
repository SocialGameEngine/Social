# Host Session Management Design

## Current Behavior
Currently, host session data (sessionId and room code) is stored in `localStorage` under the key `sidebets_host_session`. This data persists indefinitely on the device until:
1. The session is explicitly ended by the host.
2. The host manually returns to the home screen via a specific action that clears the session.
3. The session is found to be non-existent in the database during a page load.

**The Issue:** Logging out of the host account does not clear this `localStorage` data. Consequently, if a user logs out and navigates back to `/host`, the application attempts to resume the last session stored in `localStorage`, even if no user is authenticated or a different user logs in.

## Ideal Design (Database-Driven Recovery)

The most robust design is to treat the **Database as the Source of Truth** for session recovery, rather than relying primarily on `localStorage`.

### 1. Automated Session Recovery
When a user with a Venue Account navigates to the `/host` page, the application should automatically attempt to recover their active session:
- **Lookup**: Query the `sessions` table for the most recent session where `host_uid` matches the current `user.id` and the `status` is not `ended`.
- **Precedence**: This server-side check should take precedence over anything in `localStorage`.
- **User Experience**: This enables "session roaming" — a host can start a game on one device and seamlessly resume it on another just by logging in.

### 2. Session-User Binding
Host sessions must be strictly bound to the authenticated user.
- **Validation**: If a session ID exists in `localStorage` but the currently logged-in user is not its `host_uid`, the application must clear the local state.
- **Security**: This prevents unauthorized users from accessing or even seeing metadata about another host's session.

### 3. Logout Synchronization
Logging out should be a "clean slate" operation for the device.
- **Clear on Sign Out**: The `signOut` function in the `AuthProvider` should explicitly clear the `sidebets_host_session` key from `localStorage`.

### 4. Benefits
- **Multi-Device Support**: Start a session on a tablet, finish on a laptop.
- **No "Zombie" Data**: Shared devices are safe; logging out removes session traces.
- **Improved UX**: No more "Session not found" errors if `localStorage` is cleared but the session is still active in the DB.

## Proposed Implementation Plan

### Phase 1: Update `AuthProvider`
Modify `AuthProvider.signOut` to clear the host session key.

```typescript
// apps/top-comment/src/shared/providers/AuthProvider.tsx
const signOut = async () => {
  // ... existing signOut logic ...
  window.localStorage.removeItem("sidebets_host_session");
  // ...
};
```

### Phase 2: Implement Recovery Logic in `useHostSession`
Add a method to find the latest active session for a given user ID.

```typescript
// Proposed query logic for recovery:
const { data: latestSession } = await supabase
  .from('top_comment_sessions')
  .select('id, code')
  .eq('host_uid', user.id)
  .neq('status', 'ended')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### Phase 3: Update `HostPage` Initialization
On mount, if the user is authenticated but no session is active, trigger the recovery check.
