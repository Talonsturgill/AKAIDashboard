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

## Build status (as of 2026-05-31)

All planned routes are built AND populated with adversarially-verified Alaska AI ecosystem data: homepage with live counts, `/archive`, `/archive/[id]`, `/companies` + `/companies/[id]` (with @xyflow/react relationship graph), `/contracts` + `/contracts/[id]`, `/policy` + `/policy/[id]`, `/infrastructure` + `/infrastructure/[id]` (Mapbox map with graceful no-token fallback), `/admin/routines` status screen, and the `/api/search` hybrid search endpoint.

Supabase population (every row carries a `metadata.verification` block with source URL, adversarial-check verdict, and checker agent ID):
- 36 entities (telcos, 11 Alaska Native Corporations, 4 universities, state + federal agencies, infrastructure operators, tribal orgs, the Alaska BEAD program)
- 9 data sources, 12 archive articles (Alaska.AI substack + ADN + Alaska Public Media + Northern Journal)
- 13 federal contracts, 14 AI/broadband/data policies, 9 infrastructure projects (all with valid Alaska lat/long), 24 entity relationships
- `dashboard_metrics` row keyed `platform_stats` with live counts as JSONB

Writing rules for any content rendered on the site (descriptions, summaries, ak_relevance, etc.): no em dashes, colons, semicolons, or AI tells. Quoted third-party content (substack/news article bodies) preserved verbatim. See `feedback_website_content_style` memory.

Pending follow-on: set up the 8 Claude Code Routines at claude.ai/code so data stays current. (Mapbox is no longer required — see /command map stack below.)

## Integrated OSS (do not replicate)

Per the `feedback_integrate_dont_recreate` memory, the site composes purpose-built libraries instead of hand-rolling. When adding a feature, check if one of these already covers it:

- **Leaflet (vanilla)** — basemap rendering on `/command` and `/infrastructure`. Tiles via CartoCDN Dark Matter (no token, no card). Do NOT use `react-leaflet` — it breaks under React 19 + Next 15 with `Cannot read properties of undefined (reading 'appendChild')`. Stay on `useRef` + `useEffect` mount/unmount.
- **deck.gl** (`@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/aggregation-layers`) — WebGL overlays on top of Leaflet for the INTEL OVERLAYS on `/command`.
- **Tremor** (`@tremor/react`) — `<Card>`, `<Metric>`, `<Tracker>`, `<Callout>` for dashboard chrome. Used across homepage, `/contracts`, `/policy`, `/admin/routines`.
- **shadcn/ui primitives** (in `components/ui/`) — `Sheet`, `Dialog`, `Button`, `Card`, `Command`, `Badge`, `Separator`. Built with Radix under the hood.
- **cmdk** — `Cmd+K` command palette in the top nav.
- **TanStack Table v8** (`@tanstack/react-table`) — every sortable/filterable data table.
- **@xyflow/react** — entity relationship graph on `/companies/[id]`.

## /command war-room

Full-bleed Palantir-style command center at the `/command` route. Server component at `app/(public)/command/page.tsx` fetches all `infrastructure_projects` with valid latitude/longitude, plus their operator entities, plus related contracts, plus archive_content, and passes them to `components/command/CommandCenter.tsx` (the client orchestrator).

Map stack (no Mapbox token needed):
- `components/command/LeafletMap.tsx` — vanilla Leaflet via `useRef` + `useEffect`, CartoCDN Dark Matter tiles. Renders status-colored circle markers per project, the Quintillion / AlCan ONE / AIRRAQ fiber polylines, and the JBER / Eielson / Clear SFS military rings. Exposes an `onMapReady(map)` callback so the parent can hand the `L.Map` instance to `DeckOverlay`.
- `components/command/DeckOverlay.tsx` — mounts a single `<canvas>` and a single deck.gl `Deck` instance keyed off the Leaflet map's lifecycle. Used by all three INTEL OVERLAYS.

INTEL OVERLAYS (right-panel toggles in `components/command/IntelOverlayToggles.tsx`):
- **ARCS** — `ArcLayer` curves from awarding entity to winning entity per contract. Falls back to `ENTITY_HQ_FALLBACK` coords (defined in DeckOverlay) when the winning entity has no infrastructure_projects row — without this, most arcs would silently drop.
- **COLUMNS** — `ColumnLayer` extrudes a 3D column at each data-center project, height scaled from `capacity_value`. Requires `pitch > 0` in the deck viewState to be visible.
- **HEAT** — `HeatmapLayer` density of every project location, blue→amber→red ramp.

### deck.gl + Leaflet gotchas (these took hours to find — do not relitigate)

1. **z-index 450, not lower.** Leaflet's `.leaflet-map-pane` is at `z-index: 400` and creates a stacking context containing every tile, polyline, and marker. A canvas at any z < 400 will silently render — pixels written, picking works, tooltips fire — but be fully occluded by the basemap. Symptoms: tooltips show on hover but no visuals appear. Set canvas `zIndex = "450"` (above mapPane, below the tooltip element at 1000).
2. **Append canvas to `map.getContainer()`, NOT to a Leaflet pane.** Panes get CSS-transformed during pan, so a canvas inside one will translate with the map AND deck.gl will re-render at the new viewState — producing double-offset drift. The outer container does not translate.
3. **Defer `new Deck()` until `map.whenReady()`.** Calling `map.getCenter()` synchronously throws `Cannot read properties of undefined (reading '_leaflet_pos')` before Leaflet's first layout pass.
4. **Picking needs manual wiring when the canvas has `pointer-events: none`.** Deck's built-in `getTooltip` never fires because no events reach the canvas. Use `map.on('mousemove', ...)` + `deck.pickObject({x, y, radius})` + a custom tooltip `<div>` appended to `map.getContainer()`. The tooltip element is tagged `data-deck-tooltip="true"` for testability and for clearing on layer change.
5. **deck.gl zoom is Leaflet zoom minus 1.** Always compute `zoom: map.getZoom() - 1` in viewState.

Layer toggles in `components/command/LayerToggles.tsx` filter Leaflet markers by `project_type` (data center, fiber, power) plus a derived MILITARY layer matching the three EUL clusters. Clicking any marker opens `components/command/DetailPanel.tsx`, which shows the project, its operator entity link, related contracts, and related articles. KPI bar tops the layout, coordinate HUD bottom-left.

Shared constants and types live in `lib/command/constants.ts` and `lib/command/types.ts` (status colors, military keywords, fiber routes, military rings) — both LeafletMap and DeckOverlay import from there. Don't duplicate.

## Performance pitfalls

Static `import "mapbox-gl/dist/mapbox-gl.css"` or `import mapboxgl from "mapbox-gl"` at module scope inflates the route bundle by ~370 kB even with the feature gated behind a token check. `/infrastructure` was at 479 kB until the mapbox-gl reference was made truly dynamic. If a heavy library is opt-in, load it lazily with `next/dynamic` and put the static CSS import inside the dynamic module — not in the page file. Same pattern applies to deck.gl (`DeckOverlay` is loaded via `dynamic(..., { ssr: false })` from `CommandCenter`).

First request to `/command` on a cold dev server takes ~25–30 s to compile (deck.gl + Leaflet + Tremor + page server logic). This is expected; subsequent requests are instant. Tests that hit `/command` should wait ≥10 s after `goto` before asserting on canvas state.

## Visual verification protocol

Per the `feedback_always_verify_visually` memory, every UI change must be exercised in a real browser before being reported done. Pattern:
1. Start `npm run dev`, wait for `/command` (or whichever route) to compile (curl until 200, then sleep ~10 s).
2. Drive the UI with Playwright (`/tmp/shot/*.js`) — toggle the actual button, hover the actual coordinate, take a screenshot.
3. Use the Read tool on the PNG to look at the rendered pixels. Do not rely on pixel counts alone — the z-index trap above proved that "pixels in canvas" is not the same as "user sees them."
4. Only after the screenshot matches expectations, report back.
