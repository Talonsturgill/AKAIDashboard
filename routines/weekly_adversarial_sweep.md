# Routine: Weekly Adversarial Sweep

- **Schedule:** Weekly, Sundays at midnight Alaska time
- **Connectors:** Web fetch, Supabase MCP, GitHub MCP

This is the only routine that exists to catch the failure mode the daily
self-checks can't see — slow drift. The 8 daily routines each verify their
own work in isolation. This routine adversarially re-verifies a sample of the
full dataset and looks for accumulated errors across the week.

## Prompt

```
You are the weekly adversarial sweep for Alaska.AI. Your job is to find
errors the daily routines missed.

============================================================
PART 1 — MAIN TASK
============================================================

1. Open routine_runs row ('weekly_adversarial_sweep', 'running').
   SET LOCAL "app.routine_name" = 'weekly_adversarial_sweep';

2. SAMPLE: select up to 20 rows added or updated in the past 7 days,
   stratified across tables:
     5 from contracts
     5 from policies
     5 from entities
     3 from archive_content
     2 from infrastructure_projects

3. For each sampled row, perform ADVERSARIAL RE-VERIFICATION:
   a. Open the row's source_url (or metadata.verification.source_url).
   b. Independently identify the key facts you would expect to find:
      For contracts: title, contract_value, awarding agency, winning vendor,
                     award_date, status.
      For policies: title, introduced_date, current status, sponsor.
      For entities: name, type, description plausibility.
      For archive_content: title, published_at, author.
      For infrastructure_projects: name, status, location_name, operator.
   c. Compare each field to what's in the DB.
   d. Record any discrepancy as a finding with:
      { table, row_id, field, db_value, source_value, severity }
      severity = 'minor' (formatting/typo), 'moderate' (factual but small),
                 'major' (wrong entity, wrong value, hallucination).

4. INTEGRITY SWEEP across the whole dataset:
   a. Orphan entity check: SELECT id FROM entities WHERE id NOT IN
      (SELECT awarding_entity_id FROM contracts WHERE awarding_entity_id IS NOT NULL
       UNION SELECT winning_entity_id FROM contracts WHERE winning_entity_id IS NOT NULL
       UNION SELECT sponsor_entity_id FROM policies WHERE sponsor_entity_id IS NOT NULL
       UNION SELECT operator_entity_id FROM infrastructure_projects WHERE operator_entity_id IS NOT NULL
       UNION SELECT from_entity_id FROM relationships
       UNION SELECT to_entity_id FROM relationships
       UNION SELECT UNNEST(entities_mentioned) FROM archive_content)
      AND mention_count = 0 AND created_at < NOW() - INTERVAL '14 days';
      Result is "entities created and never referenced" — likely extraction noise.
   b. Suspect slug check: SELECT id, slug FROM entities WHERE slug !~ '^[a-z0-9-]+$';
   c. Suspect relationship check: SELECT id FROM relationships
      WHERE from_entity_id = to_entity_id; Self-loops are bugs.
   d. Stale source check: SELECT id, name FROM sources
      WHERE active = true AND (last_success_at IS NULL OR
      last_success_at < NOW() - INTERVAL '7 days');

5. STYLE SWEEP: SELECT id, description FROM entities WHERE description ~ '[—:;]'
   OR description ~* '(here''s a|let me know|i hope this|in conclusion)';
   These violate the writing style rules.

============================================================
PART 2 — REPORT
============================================================

6. Compose a weekly findings report with sections:
     A. Sampled verification: discrepancies found (by severity)
     B. Integrity sweep: counts per check
     C. Style sweep: violations found
     D. Drift signals: cross-week count deltas vs previous Sunday
     E. Recommended actions for Talon to take by hand

7. UPDATE routine_runs with the full report in metadata.

============================================================
PART 3 — GIT CHANGELOG COMMIT + SUBSTACK DRAFT
============================================================

8. Write data-changelog/YYYY-MM-DD/weekly_adversarial_sweep.json with the
   full findings.

9. ALSO write a Markdown summary at
   data-changelog/YYYY-MM-DD/weekly_sweep_report.md formatted for human
   reading. This is the artifact Talon scans Sunday night.

10. Commit/push: "data: weekly_adversarial_sweep run YYYY-MM-DD".

11. Exit.
```
