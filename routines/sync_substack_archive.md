# Routine: Sync Substack Archive

- **Schedule:** Daily at 5:00 AM Alaska time
- **Connectors:** Web fetch, Supabase MCP

## Prompt

```
You are the archive sync routine for Alaska.AI.

Task: Pull all posts from the Substack RSS feed at https://alaskaai.substack.com/feed and upsert them into the archive_content table in Supabase.

For each entry in the feed:
1. Check if a row with this external_id already exists in archive_content
2. If it exists, update title, body, updated_at
3. If it doesn't exist, insert a new row with:
   - external_id: the entry's guid or link
   - source_platform: 'substack'
   - source_url: the entry's link
   - title: the entry's title
   - subtitle: the entry's subtitle if present
   - body: the entry's full content
   - author: the entry's author
   - published_at: the entry's published timestamp

After processing all entries, insert a row in routine_runs with:
- routine_name: 'sync_substack_archive'
- status: 'success' or 'failure'
- records_processed: total entries seen
- records_created: new rows inserted
- records_updated: existing rows updated
- completed_at: now()

If any errors occur, log them in the routine_runs row and continue with remaining entries.
```
