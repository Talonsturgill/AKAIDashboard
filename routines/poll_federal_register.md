# Routine: Poll Federal Register

- **Schedule:** Daily at 5:45 AM Alaska time
- **Connectors:** Web fetch, Supabase MCP, GitHub MCP

## Prompt

```
You are the federal policy tracker for Alaska.AI.

============================================================
PART 1 — MAIN TASK
============================================================

1. Open routine_runs row ('poll_federal_register', 'running').
   SET LOCAL "app.routine_name" = 'poll_federal_register';

2. Query the Federal Register API (no key required):
     GET https://www.federalregister.gov/api/v1/documents.json
       ?conditions[publication_date][gte]=<today_minus_7d>
       &conditions[term]=(artificial+intelligence+OR+machine+learning+OR+algorithmic+OR+autonomous+OR+"AI")
       &per_page=200
   Then a second pass filtering by Alaska keywords:
     ?conditions[publication_date][gte]=<today_minus_7d>
       &conditions[term]=(Alaska+OR+ANCSA+OR+Arctic+OR+"North+Slope"+OR+JBER+OR+Eielson+OR+"Clear+SFS")

   Union the two result sets. De-dup on document_number.

3. For each document, keep if EITHER:
     a. Title or abstract matches an AI keyword AND mentions Alaska, OR
     b. Title or abstract matches an Alaska keyword AND has AI relevance ≥ 0.3
        per the rubric in poll_sam_gov_contracts.md (re-use that rubric).

4. Build a policies row:
     external_id        ← document.document_number (e.g. "2026-12345")
     title              ← document.title
     description        ← document.abstract (verbatim)
     policy_type        ← map:
                            'Rule'              → 'federal_rule'
                            'Proposed Rule'     → 'federal_rule'
                            'Notice'            → 'agency_guidance'
                            'Presidential Doc'  → 'executive_order'
                            else                → 'agency_guidance'
     jurisdiction       ← 'federal'
     status             ← document.publication_status or 'published'
     document_url       ← document.html_url
     introduced_date    ← document.publication_date
     last_action_date   ← document.effective_on or document.publication_date
     ai_relevance_score ← per rubric
     metadata           ← { agencies: [...], cfr_references: [...],
                            verification: { source_url: html_url,
                            checked_at, checker: 'poll_federal_register' } }

5. Upsert:
     INSERT INTO policies (...) VALUES (...)
     ON CONFLICT (external_id) DO UPDATE SET
       status = EXCLUDED.status,
       last_action_date = EXCLUDED.last_action_date,
       updated_at = NOW();

============================================================
PART 2 — SELF-VERIFICATION
============================================================

6. RE-QUERY count of policies.updated_at >= <run_started_at>. Match it.

7. DEDUP CHECK on policies.external_id. Zero duplicates expected.

8. CONSTRAINT CHECK on every new row:
     policy_type ∈ ('state_bill','federal_rule','executive_order',
                    'agency_guidance','court_ruling')
     jurisdiction = 'federal'
     ai_relevance_score BETWEEN 0 AND 1
     document_url is non-null

9. STYLE CHECK on any prose YOU wrote (abstracts are verbatim and exempt).

10. SAMPLE VERIFICATION: pick 2 newly-written rows. Fetch document_url and
    confirm the title and publication_date match.

11. UPDATE routine_runs with verification metadata.

============================================================
PART 3 — GIT CHANGELOG PR + AUTO-MERGE
============================================================

12. Write data-changelog/YYYY-MM-DD/poll_federal_register.json.

13. Push via GitHub MCP to branch
      data/YYYY-MM-DD/poll-federal-register
    Commit message: "data: poll_federal_register daily run YYYY-MM-DD".

14. Open a PR from that branch into main with the verification checklist
    in the body.

15. If verification passed: squash-merge and delete branch.
    If failed: label 'needs-review', request review from Talonsturgill,
    leave open.

16. Exit.
```
