# Routine: Poll State Legislature

- **Schedule:** Daily at 5:30 AM Alaska time
- **Connectors:** Web fetch (Alaska legislature site), Supabase MCP

## Prompt

```
You are the state policy tracker routine for Alaska.AI.

Task: Monitor the Alaska State Legislature for AI-related bills and policy actions.

1. Fetch the current legislative session bills index from https://www.akleg.gov
2. Filter for any bill whose title or summary mentions: AI, artificial intelligence, machine learning, automation, autonomous systems, data privacy, algorithmic, surveillance technology
3. For each match:
   - Check if external_id exists in policies table
   - If exists, update status, last_action_date, description
   - If new, insert with all available data
   - Set policy_type to 'state_bill'
   - Set jurisdiction to 'Alaska'
   - Score ai_relevance_score 0.0-1.0

4. Log run in routine_runs.
```
