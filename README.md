# Social

A pnpm + Turborepo monorepo for the **Social** platform — a real-time, room-based bar engagement suite (trivia, top-comment, headline-fibbage, mashup, etc.) built on **React + Vite**, **Supabase** (Postgres, Auth, Realtime, Storage), and **Stripe**. Designed to drive crowd participation and patron engagement in bars and similar venues.

## Tech stack

- **Package manager:** pnpm `>=10` (pinned to `pnpm@10.26.1`)
- **Node:** `>=20`
- **Build orchestrator:** Turborepo 2
- **Frontend:** React 18, Vite 7, TypeScript 5, TailwindCSS, framer-motion, react-router-dom 7, TanStack Query
- **Backend / data:** Supabase (Postgres + RLS + Realtime), edge functions in `supabase/`
- **Payments:** Stripe
- **AI / TTS:** OpenAI, Google Cloud Text-to-Speech
- **Testing:** Vitest, Playwright

## Repository layout

```
Social/
├── apps/
│   ├── top-comment/      # Main game client (Vite/React) — primary app
│   ├── dashboard/        # Operator/host dashboard
│   ├── prompt-admin/     # Prompt + content admin tool
│   └── web/              # Marketing / public web surface
├── packages/
│   ├── ai/               # AI helpers (OpenAI, prompt utils)
│   ├── auth/             # Auth helpers
│   ├── db/               # Supabase client + typed DB access
│   ├── game-engine/      # Shared room/round state machine
│   ├── games/            # Per-game packages (trivia, top-comment, etc.)
│   ├── payments/         # Stripe integration
│   ├── ui/               # Shared React UI components + Tailwind preset
│   └── utils/            # Cross-cutting utilities
├── database/             # Raw SQL migrations + ad-hoc fix scripts
├── supabase/             # Supabase project (config, functions, migrations)
├── scripts/              # Dev / migration / deploy scripts
├── docs/                 # Project documentation
├── tests/                # Cross-package tests
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- **Node.js** `>=20`
- **pnpm** `>=10` — install via `npm i -g pnpm` or `corepack enable && corepack prepare pnpm@10.26.1 --activate`
- **Supabase CLI** (a local `supabase.exe` is checked in for Windows; otherwise install from https://supabase.com/docs/guides/cli)
- **Docker** (or Podman) for running Supabase locally — see `scripts/setup_portable_docker.bat` / `scripts/setup_portable_podman.bat` / `scripts/setup_wsl_docker.sh`

## Getting started

```bash
# 1. Install dependencies (root + all workspaces)
pnpm install

# 2. Configure environment
cp .env.local .env.local.bak    # back up if it already exists
# Edit .env.local — see "Environment variables" below

# 3. (Optional) Start local Supabase
./scripts/start-supabase.bat    # Windows
# or: supabase start

# 4. Run all dev servers via Turbo
pnpm dev
```

The primary app (`@social/top-comment`) starts on http://localhost:5173.

## Common scripts

Run from the repo root — Turbo will fan out to all workspaces.

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Run every workspace's `dev` task in parallel    |
| `pnpm build`        | Build all apps + packages                       |
| `pnpm lint`         | Lint all workspaces                             |
| `pnpm test`         | Run unit/integration tests across workspaces    |
| `pnpm type-check`   | TypeScript `--noEmit` across the monorepo       |
| `pnpm pre-commit`   | Runs `type-check` (intended as a git hook)      |
| `pnpm clean`        | `turbo run clean` + remove root `node_modules`  |
| `pnpm dev:kill`     | Kill stuck dev processes (Windows PowerShell)   |

### Targeting a single workspace

```bash
# Run dev for just the top-comment app
pnpm --filter @social/top-comment dev

# Build a single package
pnpm --filter @social/ui build

# Add a dep to one app
pnpm --filter @social/top-comment add zod
```

### App-specific scripts

`@social/top-comment` also exposes:

- `pnpm --filter @social/top-comment test` — Vitest
- `pnpm --filter @social/top-comment test:e2e` — Playwright
- `pnpm --filter @social/top-comment preview` — preview production build

## Environment variables

Defined in `.env.local` at the repo root and consumed by Turbo (see `turbo.json`). At minimum:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payments
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# AI / TTS
OPENAI_API_KEY=
VITE_OPENAI_API_KEY=
```

Never commit real secrets. `VITE_*` values are exposed to the client; everything else is server-only.

## Database & Supabase

- **Authoritative migrations** live under `supabase/migrations/`. Apply with `supabase db push` or `supabase migration up`.
- **`database/`** contains raw SQL — full schema dumps (`production_schema.sql`), realtime/RLS fixes, and content-seeding scripts. These are reference / one-off helpers, not the normal migration path.
- Helper scripts in `scripts/` (e.g. `apply_headline_fibbage_migration.js`, `add_trivia_library.js`, `generate-prompt-migration.js`) automate common content + migration tasks.

## Documentation

Project docs live in `docs/` (architecture, implementation plans, migration notes). Start with `docs/implementation/00-index.md`.

## License

See `LICENSE`.
