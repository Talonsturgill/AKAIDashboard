# Routine: Refresh Dashboard Metrics

- **Schedule:** Daily at 9:00 AM Alaska time (last in the daily chain)
- **Connectors:** Supabase MCP, GitHub MCP

## Prompt

```
You are the metrics aggregation routine for Alaska.AI. You compute the
roll-up JSON blobs that the homepage and dashboard tiles read.

============================================================
PART 1 — MAIN TASK
============================================================

1. Open routine_runs row ('refresh_dashboard_metrics', 'running').
   SET LOCAL "app.routine_name" = 'refresh_dashboard_metrics';

2. Compute and UPSERT these dashboard_metrics rows (key + value JSONB).
   Use ON CONFLICT (key) DO UPDATE so the rows are replaced atomically.

   key = 'platform_stats':
     {
       "entities":          (SELECT COUNT(*) FROM entities),
       "contracts":         (SELECT COUNT(*) FROM contracts),
       "policies":          (SELECT COUNT(*) FROM policies),
       "archive":           (SELECT COUNT(*) FROM archive_content),
       "relationships":     (SELECT COUNT(*) FROM relationships),
       "infrastructure":    (SELECT COUNT(*) FROM infrastructure_projects),
       "total_contract_value_usd":
         (SELECT COALESCE(SUM(contract_value),0) FROM contracts),
       "as_of":             NOW()
     }

   key = 'top_entities_by_type':
     For each entity type in the enum (company, person, project, agency,
     anc, university, infrastructure, tribe, contract_holder), the top 10
     by relevance_score DESC, then mention_count DESC. Each item:
       { "id": uuid, "name": text, "slug": text,
         "relevance_score": float, "mention_count": int }

   key = 'recent_activity':
     The 50 most recently updated rows across entities, contracts, policies,
     archive_content, infrastructure_projects in the last 7 days. Each item:
       { "kind": 'entity'|'contract'|'policy'|'article'|'infrastructure',
         "id": uuid, "title": text, "updated_at": timestamp,
         "url_path": text }

   key = 'homepage_graph':
     A network graph for React Flow / @xyflow consumption.
     1. Pick the top 80 entities by relevance_score * recency_weight, where
        recency_weight = exp(-days_since_last_mentioned / 30) bounded [0.1, 1].
     2. nodes: [{ "id": uuid, "type": entity_type, "data":
        { "label": name, "type": entity_type, "relevance": score } }]
     3. edges: all rows from relationships where BOTH endpoints are in the
        top-80 set. Format: { "id": uuid, "source": uuid, "target": uuid,
        "type": relationship_type, "strength": float }

3. WRITE STYLE on any prose you produce for these blobs:
     - No em dashes, colons, or semicolons in prose-style fields
     - No AI tells
   (Names, statuses, titles are quoted from existing rows verbatim, so they
   are exempt.)

============================================================
PART 2 — SELF-VERIFICATION
============================================================

4. RE-QUERY each of the four keys. Confirm:
     platform_stats counts match what SELECT COUNT(*) returns right now.
     top_entities_by_type has exactly one entry per type, each list of
       length min(10, available entities of that type).
     recent_activity is sorted by updated_at DESC and contains no duplicates.
     homepage_graph has 0–80 nodes and every edge endpoint exists in nodes.

5. SIZE CHECK: serialize each value JSONB. If any exceeds 256 KB, flag in
   findings (the homepage payload should stay light).

6. STALENESS CHECK: compare new platform_stats counts to the previous run's
   counts. If any count went DOWN by more than 1 (rare event of intentional
   delete only), flag in findings — this likely indicates a data loss bug
   upstream.

7. UPDATE routine_runs with verification metadata.

============================================================
PART 3 — GIT CHANGELOG PR + AUTO-MERGE
============================================================

8. Write data-changelog/YYYY-MM-DD/refresh_dashboard_metrics.json.
   Include the diff vs yesterday for platform_stats counts.

9. Push via GitHub MCP to branch
     data/YYYY-MM-DD/refresh-dashboard-metrics
   Commit: "data: refresh_dashboard_metrics daily run YYYY-MM-DD".

10. Open a PR into main with the day-over-day count deltas in the body.

11. If verification passed: squash-merge and delete branch.
    If failed: label 'needs-review', request review from Talonsturgill,
    leave open.

12. Exit.
```
