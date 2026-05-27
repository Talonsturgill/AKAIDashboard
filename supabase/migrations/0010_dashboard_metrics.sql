CREATE TABLE dashboard_metrics (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to dashboard_metrics"
    ON dashboard_metrics FOR SELECT
    TO anon, authenticated
    USING (true);
