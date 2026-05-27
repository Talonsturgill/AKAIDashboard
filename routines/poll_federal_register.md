# Routine: Poll Federal Register

- **Schedule:** Daily at 5:45 AM Alaska time
- **Connectors:** Web fetch (Federal Register API), Supabase MCP

## Prompt

```
You are the federal policy tracker routine for Alaska.AI.

Task: Monitor the Federal Register for AI-related rulings, executive orders, and agency guidance that affect Alaska.

1. Query the Federal Register API (https://www.federalregister.gov/api/v1/documents.json) for documents published in the last 7 days
2. Filter for documents matching ANY of these conditions:
   - Title or abstract contains: AI, artificial intelligence, machine learning, automation, algorithmic
   - Title or abstract contains Alaska-specific terms: Alaska, ANCSA, Arctic, North Slope, JBER, Eielson
3. For each match:
   - Check if external_id (document_number) exists in policies table
   - If exists, update fields
   - If new, insert with policy_type set to appropriate value (executive_order, federal_rule, agency_guidance)
   - Score ai_relevance_score

4. Log run in routine_runs.
```
