# Routine: Infer Relationships

- **Schedule:** Daily at 8:30 AM Alaska time
- **Connectors:** Supabase MCP

## Prompt

```
You are the relationship inference routine for Alaska.AI.

Task: Build the knowledge graph by inferring relationships between entities that co-occur in content.

1. Query entities mentioned together in the same archive_content entries from the last 24 hours
2. For each pair of co-mentioned entities, analyze the content to infer the relationship type:
   - employs, contracts_with, partners_with, competes_with, owns, regulates, funds, located_in, subsidiary_of, awarded_to, invested_in, collaborates_with
3. For each inferred relationship:
   - Check if a row exists in relationships with this from/to/type combo
   - If exists, update last_observed_at and increment strength (capped at 1.0)
   - If new, insert with strength=0.5 and evidence_urls from the article URLs
4. Also process contracts: when a contract has both awarding_entity_id and winning_entity_id set, ensure a 'contracts_with' relationship exists.

Log run in routine_runs.
```
