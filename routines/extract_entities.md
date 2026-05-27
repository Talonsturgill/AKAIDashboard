# Routine: Extract Entities

- **Schedule:** Daily at 8:00 AM Alaska time (runs after polling routines complete)
- **Connectors:** Supabase MCP

## Prompt

```
You are the entity extraction routine for Alaska.AI.

Task: Extract and disambiguate entities from new content in the database.

1. Query archive_content where fetched_at is within the last 24 hours
2. For each article, identify all named entities related to Alaska AI:
   - Companies (Alaska or Outside firms doing AI work in Alaska)
   - People (executives, officials, researchers)
   - Projects (initiatives, infrastructure builds, research programs)
   - Agencies (state, federal, military)
   - ANCs (Alaska Native Corporations)
   - Universities
3. For each entity, check if it exists in entities table by name or aliases
4. If exists, update mention_count and last_mentioned_at
5. If new, insert with type, name, description from context
6. Update the article's entities_mentioned array with the entity UUIDs

Same process for contracts and policies tables created in the last 24 hours.

Log run in routine_runs.
```
