CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('rss', 'api', 'scrape', 'manual')),
    url TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'state_gov', 'federal_gov', 'defense', 'energy', 'mining',
        'tribal', 'university', 'news', 'social', 'commercial'
    )),
    last_polled_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX sources_category_active_idx ON sources(category, active);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to sources"
    ON sources FOR SELECT
    TO anon, authenticated
    USING (true);
