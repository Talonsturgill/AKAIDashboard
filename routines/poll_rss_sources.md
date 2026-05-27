# Routine: Poll RSS Sources

- **Schedule:** Daily at 6:00 AM Alaska time
- **Connectors:** Web fetch, Supabase MCP

## Prompt

```
You are the news source polling routine for Alaska.AI.

Task: Pull recent items from all active RSS sources tracking Alaska AI news.

1. Query the sources table for all rows where active=true and type='rss'
2. For each source, fetch the RSS feed
3. For each entry, check if it discusses AI activity in Alaska (technology, contracts, companies, policy, infrastructure)
4. For AI-relevant entries, extract entities mentioned (companies, agencies, projects, people)
5. For each entity, upsert into entities table
6. Update source's last_polled_at and last_success_at timestamps

7. Log run in routine_runs.
```
