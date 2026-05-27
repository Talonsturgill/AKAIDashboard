# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Alaska.AI — a read-only "intelligence layer" dashboard for the Alaska AI ecosystem (entities, contracts, policy, infrastructure, content). Next.js 15 App Router + React 19 + Tailwind v4 + TypeScript (strict), reading from Supabase Postgres.

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint (eslint-config-next)
npm run typecheck  # tsc --noEmit, strict type check
```

No test framework is configured — there is no test runner or test in this repo.

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`). Every env var is `NEXT_PUBLIC_`-prefixed; the app holds no server-only secret.

## The central architecture fact: this app never writes data

```
Claude Code Routines  ->  Supabase Postgres  ->  Next.js dashboard (this repo)
  (daily AI agents)         (pgvector + FTS)         (read-only)
```

Data ingestion happens **outside this codebase**. Eight scheduled "Claude Code Routines" run daily at claude.ai/code, hit external APIs (Substack, SAM.gov, Federal Register, RSS, state legislature), and upsert into Supabase through the Supabase MCP connector. This repo only stores their prompts as version-controlled markdown in `routines/` — the source of truth so they can be reviewed and re-created. There is no ingestion, cron, or write code here; the Next.js app only ever SELECTs.

Consequence: if the site looks empty, the database is empty because the routines haven't run — not a bug. See `routines/README.md` for the routine list, schedule, and dependency order (polling routines seed raw content, then enrichment routines derive entities/relationships/metrics).

## Supabase access

Three thin clients in `lib/supabase/`, all using the same publishable (anon) key:
- `server.ts` — `createClient()` (async) for Server Components and route handlers; reads cookies via `@supabase/ssr`.
- `client.ts` — `createClient()` for browser/client components.
- `middleware.ts` — `updateSession()` for session refresh.
- `types.ts` — generated `Database` type; queries are typed against it. Regenerate after any schema change.

RLS model: every table enables RLS with a single policy — `FOR SELECT TO anon, authenticated USING (true)`. The anon key reads everything and writes nothing; all writes go through the routines (elevated creds via the MCP). Don't add client/server writes through these clients expecting them to succeed.

## Database schema

`supabase/migrations/*.sql`, applied in numeric order (Supabase SQL editor or `supabase db push`):
- `0001` enables `vector` (pgvector), `pg_trgm`, `uuid-ossp`.
- Core tables: `sources`, `entities`, `relationships`, `archive_content`, `contracts`, `policies`, `infrastructure_projects`. Recurring columns: `external_id TEXT UNIQUE` (routines upsert on this), `metadata JSONB`, `ai_relevance_score`, plus FTS gin indexes.
- `dashboard_metrics` — key/value JSONB store; the homepage reads the row keyed `platform_stats`.
- `routine_runs` — observability log; each routine writes start/finish status and counts.
- `archive_content.body_embedding` — `vector` column for semantic search.

## Search

`universal_search(query_text, query_embedding vector(1536), match_count)` (migration `0011`) is a hybrid-search SQL function: pgvector cosine distance + full-text `ts_rank_cd`, UNION ALL across archive/entities/contracts/policies, ordered by blended score. The client UI is `components/search/UniversalSearch.tsx`, which POSTs to `app/api/search/route.ts`, which calls the function via `.rpc()`. Two things to know:
- Embeddings aren't wired up yet, so the route passes a **1536-dim zero-vector** — search is effectively text-only for now. Adding an embedding service is the intended follow-up (the `.rpc` call is cast `as any` because the generated types don't cover it).
- The function emits `url_path`s like `/companies/:id`, `/contracts/:id`, `/policy/:id`, but **only `/archive/:id` is built** — other result types currently link to routes that 404.

## Frontend conventions

- App Router with one route group, `app/(public)/`. Root `app/layout.tsx` hardcodes `<html className="dark">`, loads Geist Sans + JetBrains Mono as CSS vars, and sets metadata; `(public)/layout.tsx` wraps every page in the shared `Navigation` + `Footer`.
- Import alias `@/*` maps to the repo root (`@/lib/...`, `@/components/...`).
- Data fetching is server-side in async page components with ISR via `export const revalidate = <seconds>` (homepage 300, archive 60). Pages query Supabase directly and render the empty/zero state inline (e.g. the archive's `EmptyState`), so they degrade gracefully before any data exists.
- Tailwind v4 — no `tailwind.config.js`. Configured through `@tailwindcss/postcss` and `app/globals.css`, which defines the brand as CSS custom properties (`--color-aurora-cyan`, `--color-text-primary`, …) and utility classes (`aurora-gradient-text`, `label-eyebrow`). The look is a dark "aurora" theme; brand pieces live in `components/brand/`.

## Build status (what exists vs. planned)

Built (README phases 1–2): homepage, `/archive`, `/archive/[id]`, and the search API.

Referenced but not yet built — expect missing routes and placeholder copy until done: entities + network graph (`/companies`), contract tracker (`/contracts`), policy pulse (`/policy`), infrastructure map (uses `NEXT_PUBLIC_MAPBOX_TOKEN`), and an admin/observability page (`/admin/routines`) that would read `routine_runs`.
