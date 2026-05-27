CREATE TABLE routine_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_name TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failure')),
    records_processed INTEGER,
    records_created INTEGER,
    records_updated INTEGER,
    notes TEXT,
    error TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX routine_runs_name_started_idx ON routine_runs(routine_name, started_at DESC);

ALTER TABLE routine_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to routine_runs"
    ON routine_runs FOR SELECT
    TO anon, authenticated
    USING (true);
