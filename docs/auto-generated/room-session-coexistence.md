# Room + Session Coexistence (Top Comment)

## Why this change
The previous model used a single **Session** as both the lobby and the game. The new model splits responsibilities:
- **Room** = persistent lobby and membership.
- **Session** = a single game run that uses the room's players.

This preserves the old experience while allowing multiple sessions to run inside the same room without losing the lobby or players.

## Conceptual split

### Room (Persistent Lobby)
- Owns the **join code** players use.
- Tracks **room memberships** (who is in the lobby).
- Survives across multiple game sessions.
- Lives at `/host` as the primary host context.

### Session (Game Runtime)
- Runs the actual game (rounds, answers, votes, results).
- Is created **inside a room**.
- Does **not** own the public join code.
- Ends without destroying the room.

## How it maps to the old session-only model

### Before (Session-only)
- **Session** handled: join code + lobby + game runtime.
- Ending a session effectively ended the entire experience.
- Starting a new game meant starting a new session and lobby.

### Now (Room + Session)
- **Room** handles: join code + lobby + membership.
- **Session** handles: game runtime only.
- Ending a session returns everyone to the room lobby.
- The host can start a new session without re-creating the room.

## Host flow (unchanged experience, new internals)
1. Host navigates to `/host`.
2. If no room exists, host creates a **Room**.
3. Lobby appears immediately (even before session exists).
4. Host clicks **New Session**.
5. A **Session** is created inside the room.
6. Host starts the session; gameplay proceeds just like before.
7. Ending the session returns to the room lobby (room persists).

## Player flow (room-first join)
1. Player uses the **room code** to join.
2. If no session exists, player waits in the lobby.
3. When host starts a session, players are pulled into the game automatically.

## Data boundaries

### Room data (persistent)
- `rooms.code` (public join code)
- `room_memberships` (who is in the lobby)
- `rooms.current_session_id` (which session is active, if any)

### Session data (ephemeral game state)
- `top_comment_sessions.*` (status, rounds, timers)
- `top_comment_players` (session players, generated from room members)
- `top_comment_answers`, `top_comment_votes`, analytics

## Key guarantees
- **Room code never changes** between sessions.
- **Lobby is always driven by room memberships**, regardless of session state.
- A session can end without removing players from the room.
- Multiple sessions can be created over time in a single room.

## Mental model summary
Think of a **Room** as the venue and a **Session** as a single show.
The venue stays open; the show can start and end multiple times.

