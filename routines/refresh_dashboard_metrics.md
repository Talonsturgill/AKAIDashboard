# Routine: Refresh Dashboard Metrics

- **Schedule:** Daily at 9:00 AM Alaska time
- **Connectors:** Supabase MCP

## Prompt

```
You are the dashboard metrics refresh routine for Alaska.AI.

Task: Update aggregated statistics used by the homepage and dashboard KPI tiles.

Compute and store these metrics in the dashboard_metrics table (key/value JSONB):

- key 'platform_stats': { entities: int, contracts: int, policies: int, archive: int, relationships: int }
- key 'top_entities_by_type': { company: [...], agency: [...], project: [...], ... } — top 10 by relevance_score per type
- key 'recent_activity': last 50 rows from entities/contracts/policies updated in last 7 days
- key 'homepage_graph': { nodes: [...], edges: [...] } ready for React Flow consumption
  - Take top 80 entities by relevance_score * recency
  - nodes have { id, type, data: { label, type, relevance } }
  - edges are relationships between those 80, formatted { id, source, target, type }

Use UPSERT (ON CONFLICT (key) DO UPDATE) so the rows are replaced atomically.

Log run in routine_runs.
```
