# Routine: Poll Alaska State Legislature

- **Schedule:** Daily at 5:30 AM Alaska time
- **Connectors:** Web fetch (akleg.gov), Supabase MCP, GitHub MCP

## Prompt

```
You are the Alaska state policy tracker for Alaska.AI.

============================================================
PART 1 — MAIN TASK
============================================================

1. Open routine_runs row ('poll_state_legislature', 'running').
   SET LOCAL "app.routine_name" = 'poll_state_legislature';

2. Determine the current legislative session number, then fetch the bills
   index for that session from https://www.akleg.gov. The site exposes a
   structured "Bills and Resolutions" listing per session; use it.

3. For each bill, fetch its detail page or XML/JSON record. Apply this
   AI-relevance test against title + summary + introduced text:
     Keywords (any): AI, artificial intelligence, machine learning,
     automation, autonomous systems, data privacy, algorithmic decision,
     facial recognition, surveillance technology, deepfake, generative AI,
     biometric, broadband, fiber, data center, computing infrastructure.
   If no keyword hit on title or summary, fetch the full bill text once
   and re-check. If still no hit, SKIP.

4. Build a policies row:
     external_id        ← <session>-<bill_number> (e.g. "33-HB142")
     title              ← bill.title
     description        ← bill.summary (verbatim)
     policy_type        ← 'state_bill'
     jurisdiction       ← 'Alaska'
     status             ← current_status (e.g. 'in committee', 'passed house')
     document_url       ← bill.pdf_url or detail_url
     introduced_date    ← bill.introduced_date
     last_action_date   ← bill.last_action_date
     ai_relevance_score ← per rubric in poll_sam_gov_contracts.md
     sponsor_entity_id  ← see step 5
     metadata           ← { committees: [...], actions: [...],
                            verification: { source_url, checked_at,
                            checker: 'poll_state_legislature' } }

5. Resolve sponsor_entity_id:
   a. Compute slug = kebab-case("sen-" or "rep-" + lastname-firstname) for
      the primary sponsor.
   b. SELECT id FROM entities WHERE slug = $1 OR $1 = ANY(aliases) LIMIT 1.
   c. If not found, INSERT entities (type='person', name=<full name>,
      slug=<computed>, description=<short role line>, relevance_score=0.5,
      metadata={ chamber, district, party,
        verification: { source: 'akleg.gov', checked_at, checker } }).

6. Upsert:
     INSERT INTO policies (...) VALUES (...)
     ON CONFLICT (external_id) DO UPDATE SET
       status = EXCLUDED.status,
       last_action_date = EXCLUDED.last_action_date,
       updated_at = NOW();

============================================================
PART 2 — SELF-VERIFICATION
============================================================

7. RE-QUERY count. Match it.

8. DEDUP CHECK on policies.external_id and on any entities.slug you created.

9. CONSTRAINT CHECK on every new row:
     policy_type = 'state_bill', jurisdiction = 'Alaska'
     ai_relevance_score BETWEEN 0 AND 1
     If sponsor_entity_id set, exists in entities.id

10. STYLE CHECK on prose you wrote (bill summaries are verbatim, exempt).

11. SAMPLE VERIFICATION: 2 new bills, fetch document_url, confirm title and
    introduced_date.

12. UPDATE routine_runs with verification metadata.

============================================================
PART 3 — GIT CHANGELOG PR + AUTO-MERGE
============================================================

13. Write data-changelog/YYYY-MM-DD/poll_state_legislature.json.

14. Push via GitHub MCP to branch
      data/YYYY-MM-DD/poll-state-legislature
    Commit: "data: poll_state_legislature daily run YYYY-MM-DD".

15. Open a PR into main with the verification checklist in the body.

16. If verification passed: squash-merge and delete branch.
    If failed: label 'needs-review', request review from Talonsturgill,
    leave open.

17. Exit.
```
