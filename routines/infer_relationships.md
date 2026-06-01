# Routine: Infer Relationships

- **Schedule:** Daily at 8:30 AM Alaska time (after extract_entities)
- **Connectors:** Supabase MCP, GitHub MCP

## Prompt

```
You are the relationship inference routine for Alaska.AI. You build the
knowledge graph by finding co-occurring entities and deciding how they
relate.

============================================================
PART 1 — MAIN TASK
============================================================

1. Open routine_runs row ('infer_relationships', 'running').
   SET LOCAL "app.routine_name" = 'infer_relationships';

2. Build the corpus to analyze:
     SELECT id, title, body, entities_mentioned, source_url FROM archive_content
       WHERE updated_at >= NOW() - INTERVAL '24 hours'
         AND array_length(entities_mentioned, 1) >= 2;
   Each row gives you a set of entity UUIDs that appeared in the same piece
   of content.

3. For each row, for each unordered pair of entities (a, b) where a.id != b.id:
   Read the surrounding text in body for both entity mentions. Decide which
   single relationship_type best describes how a relates to b in this content:
     'employs'           a employs b
     'contracts_with'    a holds a contract with b
     'partners_with'     a has a non-contractual partnership with b
     'competes_with'     a competes with b in a market
     'owns'              a owns b (subsidiary, asset, equity > 50%)
     'regulates'         a (typically agency) regulates b
     'funds'             a provides funding to b (grant, investment, award)
     'located_in'        a is physically located within b (b is geography)
     'subsidiary_of'     a is a subsidiary of b
     'awarded_to'        a contract from a went to b
     'invested_in'       a holds investment in b (< 50% equity)
     'collaborates_with' a and b collaborate on a project (use only if no
                         more specific type fits)
   If the text does NOT support any of these types with reasonable certainty,
   SKIP this pair. Do not invent relationships.

4. For each pair you keep, upsert into relationships:
     SELECT id FROM relationships
       WHERE from_entity_id = $a AND to_entity_id = $b
         AND relationship_type = $type;
     If exists:
       UPDATE relationships SET
         last_observed_at = NOW(),
         strength = LEAST(strength + 0.05, 1.0),
         evidence_urls = ARRAY(
           SELECT DISTINCT UNNEST(evidence_urls || $source_url::text))
         WHERE id = $id;
     If not exists:
       INSERT relationships (from_entity_id, to_entity_id, relationship_type,
         strength, evidence_urls, first_observed_at, last_observed_at,
         metadata) VALUES ($a, $b, $type, 0.5, ARRAY[$source_url], NOW(),
         NOW(), jsonb_build_object('verification', jsonb_build_object(
           'source_url', $source_url, 'checked_at', NOW(),
           'checker', 'infer_relationships')));

5. Bootstrap relationships from structured tables:
   For each contract with both awarding_entity_id and winning_entity_id set,
   ensure a 'contracts_with' relationship exists between them (from = winner,
   to = awarder), and an 'awarded_to' from awarder to winner. Use the
   contract's source_url as evidence.

============================================================
PART 2 — SELF-VERIFICATION
============================================================

6. RE-QUERY count of relationships created/updated this run. Match tracker.

7. DEDUP CHECK: SELECT from_entity_id, to_entity_id, relationship_type,
   COUNT(*) FROM relationships GROUP BY 1,2,3 HAVING COUNT(*) > 1. Zero rows.

8. CONSTRAINT CHECK on every new row:
     relationship_type is in the allowed enum
     from_entity_id and to_entity_id both exist in entities.id
     from_entity_id != to_entity_id
     strength BETWEEN 0 AND 1

9. EVIDENCE CHECK: for 3 random newly-inferred relationships, re-open the
   evidence_urls source and confirm the relationship is supported by the
   text. Unsupported relationships are blocking — DELETE them.

10. UPDATE routine_runs with verification metadata.

============================================================
PART 3 — GIT CHANGELOG PR + AUTO-MERGE
============================================================

11. Write data-changelog/YYYY-MM-DD/infer_relationships.json.

12. Push via GitHub MCP to branch
      data/YYYY-MM-DD/infer-relationships
    Commit: "data: infer_relationships daily run YYYY-MM-DD".

13. Open a PR into main with the verification checklist in the body.

14. If verification passed: squash-merge and delete branch.
    If failed: label 'needs-review', request review from Talonsturgill,
    leave open.

15. Exit.
```
