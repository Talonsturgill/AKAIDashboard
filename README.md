# Alaska.AI Dashboard

The intelligence layer for AI in Alaska. A Palantir-esque dashboard tracking the
entities, contracts, policy, infrastructure, and content that make up the
Alaska AI ecosystem.

## Architecture

```
Claude Code Routines  →  Supabase Postgres  →  Next.js dashboard
   (daily prompts)        (pgvector + FTS)        (Vercel)
```

- **Data maintenance:** 8 scheduled [Claude Code Routines](./routines/README.md)
  run daily, hitting external APIs (SAM.gov, Federal Register, RSS, Substack)
  and writing into Supabase via the Supabase MCP connector.
- **Database:** Supabase Postgres with `pgvector`, `pg_trgm`, and full-text
  search. RLS-protected, public read.
- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind v4. Renders data
  directly from Supabase.

## What lives where

- `app/` — Next.js App Router. `(public)` is the storefront, `api/` is the
  search endpoint.
- `components/` — Brand, layout, and search components.
- `lib/supabase/` — Browser, server, and middleware Supabase clients +
  generated `Database` types.
- `supabase/migrations/` — SQL schema, version controlled.
- `routines/` — Source-of-truth prompts for each scheduled routine.

## Local development

```bash
# 1. Install
npm install

# 2. Configure Supabase credentials
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# 3. Run
npm run dev    # http://localhost:3000
```

## Database setup

If you're spinning up a fresh Supabase project, apply the migrations in
`supabase/migrations/` in numeric order via the Supabase SQL editor or
`supabase db push`.

After applying, regenerate types if the schema changes:

```bash
# (requires the Supabase MCP or CLI)
# Result goes into lib/supabase/types.ts
```

## Creating the routines

1. Open [claude.ai/code](https://claude.ai/code).
2. For each file in `routines/*.md`, create a new routine and paste its prompt.
3. Attach the **Supabase MCP** connector (and **Web fetch** where the prompt
   indicates).
4. Set the schedule per [`routines/README.md`](./routines/README.md).
5. Run each once manually to seed the database, then leave on schedule.

The first routine to run should be `sync_substack_archive` — once it completes,
the `/archive` page on the dashboard will populate.

## Deploying to Vercel

1. Import the repo into [Vercel](https://vercel.com/new).
2. Add the env vars from `.env.example` (use your real Supabase URL + key).
3. Deploy. Vercel auto-detects Next.js.

## Build status

| Phase | Status |
| --- | --- |
| 1 — Foundation | ✅ |
| 2 — Archive + Search | ✅ |
| 3 — Entities + Network graph | ⏳ |
| 4 — Contract tracker | ⏳ |
| 5 — Policy pulse | ⏳ |
| 6 — Infrastructure map | ⏳ |
| 7 — Admin + polish | ⏳ |
