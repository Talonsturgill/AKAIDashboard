# Data changelog

Every Alaska.AI Claude Routine, at the end of its daily run, writes a JSON
manifest of what it changed in the database into this directory and commits it
to the repo. This is Layer 2 of the routine-verification model documented in
`routines/README.md`.

## Why this exists

The Alaska.AI dashboard is read by policymakers, operators, investors,
journalists, and the public. The underlying dataset has to be verifiable
end-to-end, not just trusted because an autonomous agent said so. Git history
gives us that audit trail for free:

- Anyone can browse the daily commits and see exactly which rows were created
  or updated, with the source URLs the data came from.
- Anything that looks wrong can be `git revert`-ed, then the corrected
  routine can re-run.
- A run that never happens leaves a visible gap on the calendar of commits.
- The dashboard's "Updated daily" claim becomes provable, not a marketing line.

## File layout

```
data-changelog/
├── README.md                                  (this file)
└── YYYY-MM-DD/
    ├── sync_substack_archive.json
    ├── poll_sam_gov_contracts.json
    ├── poll_federal_register.json
    ├── poll_state_legislature.json
    ├── poll_rss_sources.json
    ├── extract_entities.json
    ├── infer_relationships.json
    ├── refresh_dashboard_metrics.json
    └── weekly_adversarial_sweep.json          (Sundays only)
```

## Manifest schema

Every routine writes a file shaped like this:

```json
{
  "routine": "poll_sam_gov_contracts",
  "run_at": "2026-05-31T05:15:00-08:00",
  "summary": {
    "fetched": 27,
    "created": 4,
    "updated": 2,
    "skipped": 21,
    "failed": 0
  },
  "created": [
    {
      "table": "contracts",
      "external_id": "W912DY-26-R-0042",
      "title": "AI/ML Decision Support for Arctic ISR",
      "value_usd": 24500000,
      "source_url": "https://sam.gov/opp/..."
    }
  ],
  "updated": [
    {
      "table": "contracts",
      "external_id": "...",
      "fields_changed": ["status", "award_date"]
    }
  ],
  "verification": {
    "count_match": true,
    "dedup_clean": true,
    "constraint_clean": true,
    "style_clean": true,
    "sample_check": {
      "sampled": 3,
      "verified": 3,
      "discrepancies": []
    }
  },
  "issues": []
}
```

If `issues` is non-empty or any `verification` field is false, the corresponding
`routine_runs` row is marked `partial_success` or `failure` and the on-call
person is expected to investigate.

## Commit convention

Routines do NOT push directly to main. Each run:

1. Writes its manifest to this directory on a NEW branch
   `data/YYYY-MM-DD/<routine-slug>`.
2. Opens a pull request into main with title
   `data: <routine_name> daily run YYYY-MM-DD` and the verification
   checklist in the PR body.
3. If verification passed → squash-merges the PR and deletes the branch
   (so main history reads like a direct commit, but the merge preserves
   the report).
4. If verification failed → leaves the PR open, applies the
   `needs-review` label, requests review from `Talonsturgill`.

The `weekly_adversarial_sweep` PR is NEVER auto-merged regardless of
findings — it always sits open under the `weekly-sweep` label until a
human reviews and merges it by hand.

No author attribution beyond the GitHub account the routine pushes from.
Commit messages and PR bodies must NOT contain "Generated with Claude",
"Co-Authored-By: Claude", or any similar AI marker.
