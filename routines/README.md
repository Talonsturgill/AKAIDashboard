# Claude Code Routines — Alaska.AI

The 8 daily routines (plus 1 weekly) that keep the Alaska.AI database current
and verified. Each markdown file in this directory is the canonical prompt
for one routine. The routines themselves live at
[claude.ai/code](https://claude.ai/code) — these files are the source-of-truth
so the prompts can be version-controlled, reviewed, and re-created if a
routine is ever deleted.

## Setup once per routine

1. Open [claude.ai/code](https://claude.ai/code) and create a new routine.
2. Attach connectors as listed at the top of each prompt file. Every routine
   needs **Supabase MCP** and **GitHub MCP**. Polling routines also need
   **Web fetch**.
3. Paste the prompt from the corresponding markdown file.
4. Set the schedule below.
5. Run once manually to verify, then leave on the schedule.

## Schedule

All times Alaska time (AKT). Times are staggered so the routines don't
contend for the Supabase write pool.

| Routine | File | When | Connectors |
|---|---|---|---|
| Sync Substack archive | `sync_substack_archive.md` | Daily 5:00 AM | Web fetch, Supabase MCP, GitHub MCP |
| Poll SAM.gov contracts | `poll_sam_gov_contracts.md` | Daily 5:15 AM | Web fetch, Supabase MCP, GitHub MCP |
| Poll state legislature | `poll_state_legislature.md` | Daily 5:30 AM | Web fetch, Supabase MCP, GitHub MCP |
| Poll Federal Register | `poll_federal_register.md` | Daily 5:45 AM | Web fetch, Supabase MCP, GitHub MCP |
| Poll RSS sources | `poll_rss_sources.md` | Daily 6:00 AM | Web fetch, Supabase MCP, GitHub MCP |
| Extract entities | `extract_entities.md` | Daily 8:00 AM | Supabase MCP, GitHub MCP |
| Infer relationships | `infer_relationships.md` | Daily 8:30 AM | Supabase MCP, GitHub MCP |
| Refresh dashboard metrics | `refresh_dashboard_metrics.md` | Daily 9:00 AM | Supabase MCP, GitHub MCP |
| Weekly adversarial sweep | `weekly_adversarial_sweep.md` | Sunday 00:00 AM | Web fetch, Supabase MCP, GitHub MCP |

Polling routines (5:00–6:00 AM) populate raw content. Enrichment routines
(8:00–9:00 AM) read that content, infer structure, and update derived
tables. Always schedule polling before enrichment.

## The four-layer verification model

The risk with agentic routines is that "the routine ran" is not the same as
"the routine produced correct data." Anthropic's own documentation flags this:
*"A green status in the run list means the session started and exited without
an infrastructure error. It does not mean the task in your prompt succeeded."*

Alaska.AI defends against silent failure with four overlapping layers:

### Layer 1 — Per-routine self-check (in every prompt)
Each of the 8 daily prompts ends with a Part 2 verification block. Before
exiting, the routine re-queries what it wrote and checks count parity,
duplicates, constraint validity, writing-style compliance, and re-verifies a
random sample against the source URL. Findings are written into
`routine_runs.metadata.verification`.

### Layer 2 — Git changelog commit (in every prompt)
Every routine, after verifying, writes a JSON manifest of its run to
`data-changelog/YYYY-MM-DD/<routine_name>.json` and commits it to the
repo's main branch. This produces a permanent, browseable, diff-able audit
trail of every dataset change. A run that never happens leaves a visible
gap on the commit calendar. See [`data-changelog/README.md`](../data-changelog/README.md)
for the manifest schema.

### Layer 3 — Database-level guards (in `supabase/migrations/0013_data_integrity_guards.sql`)
- `audit_log` table records every INSERT/UPDATE/DELETE on the core tables via
  trigger, independent of what the routine self-reports. Routines tag their
  writes by executing `SET LOCAL "app.routine_name" = '...'` so the audit
  log attributes correctly.
- A `protect_human_verified` trigger refuses any UPDATE or DELETE against a
  row whose `metadata->>'human_verified' = 'true'` unless the new value
  also carries `human_verified = 'true'`. Protects the adversarially-seeded
  data from silent overwrite.

### Layer 4 — Weekly adversarial sweep (`weekly_adversarial_sweep.md`)
Sunday midnight, one routine samples 20 rows added or updated that week,
re-verifies each against its source URL adversarially (no prior assumptions),
and writes a findings report to `data-changelog/<date>/weekly_sweep_report.md`.
Catches the slow-drift failure mode that per-run checks cannot see.

## Required env / secrets

| Secret | Used by | Where to set |
|---|---|---|
| `SAM_GOV_API_KEY` | poll_sam_gov_contracts | claude.ai/code routine env vars |
| Supabase service-role key | all routines (via Supabase MCP) | Supabase MCP credential |
| GitHub PAT with write access to `Talonsturgill/AKAIDashboard` | all routines (via GitHub MCP) | GitHub MCP credential |

## Observability

- **routine_runs table** — every run's status, counts, findings, error.
- **/admin/routines page** — UI on top of routine_runs.
- **data-changelog/ directory** — Git-tracked record of every change.
- **audit_log table** — DB-level ground truth, queryable by anyone with the
  anon key (RLS public read).

## No AI attribution on commits

Per the project's standing rule, commit messages and any in-repo text must
NOT contain "Co-Authored-By: Claude", "Generated with Claude Code", or any
similar AI marker. The dashboard is read by journalists, policymakers, and
the public, and the data trail must read as institutional, not as the output
of a chatbot.
