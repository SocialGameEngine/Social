# Pub Söcial (Top Comment)

React + TypeScript + Vite app powering the Pub Söcial crowd-powered party game platform.

Part of the `@social` monorepo. Workspace dependencies:
- `@social/db` — Shared Supabase client factory
- `@social/game-engine` — Shared game engine abstractions
- `@social/game-topcomment` — Top-comment specific game logic
- `@social/ui` — Shared UI components

## Available scripts

```bash
pnpm run dev      # start local dev server
pnpm run build    # typecheck and build for production
pnpm run lint     # run ESLint
pnpm run test     # run unit tests (vitest)
pnpm run test:e2e # run E2E tests (playwright)
```

## Configuration

Configuration lives in `.env.local` (or `.env`) via `VITE_SUPABASE_*` values. Keep real keys out of version control.

See the repository root `README.md` for full setup instructions.
