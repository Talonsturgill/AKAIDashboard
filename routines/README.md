# Claude Code Routines — Alaska.AI

This directory contains the canonical prompt for each Claude Code Routine that
maintains the Alaska.AI database. The routines themselves live in
[claude.ai/code](https://claude.ai/code) — these markdown files are the
source-of-truth so the prompts can be version controlled, reviewed in PRs, and
re-created if a routine is ever deleted.

## Setup once

For each routine below:

1. Open [claude.ai/code](https://claude.ai/code) and create a new routine.
2. Attach the **Supabase MCP** connector (and **Web Fetch** where indicated).
3. Paste the prompt from the corresponding markdown file in this directory.
4. Set the schedule below.
5. Run once manually to verify, then leave on the schedule.

## Schedule

| Routine | File | Schedule (AKT) | Connectors |
| --- | --- | --- | --- |
| Sync Substack archive | `sync_substack_archive.md` | Daily 5:00 AM | Web fetch, Supabase MCP |
| Poll SAM.gov contracts | `poll_sam_gov_contracts.md` | Daily 5:15 AM | Web fetch, Supabase MCP |
| Poll state legislature | `poll_state_legislature.md` | Daily 5:30 AM | Web fetch, Supabase MCP |
| Poll Federal Register | `poll_federal_register.md` | Daily 5:45 AM | Web fetch, Supabase MCP |
| Poll RSS sources | `poll_rss_sources.md` | Daily 6:00 AM | Web fetch, Supabase MCP |
| Extract entities | `extract_entities.md` | Daily 8:00 AM | Supabase MCP |
| Infer relationships | `infer_relationships.md` | Daily 8:30 AM | Supabase MCP |
| Refresh dashboard metrics | `refresh_dashboard_metrics.md` | Daily 9:00 AM | Supabase MCP |

8 routines/day. The Max plan allows 15/day.

## Observability

Every routine writes a row into the `routine_runs` table when it starts and
updates it on completion (status, counts, error). The admin dashboard at
`/admin/routines` reads from this table.

## Order of dependency

Polling routines (5:00–6:00 AM) populate raw content. Enrichment routines
(8:00–9:00 AM) read that raw content, infer structure, and update derived
tables. Always schedule polling before enrichment.
