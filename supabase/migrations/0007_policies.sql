CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    policy_type TEXT CHECK (policy_type IN ('state_bill', 'federal_rule', 'executive_order', 'agency_guidance', 'court_ruling')),
    jurisdiction TEXT,
    status TEXT,
    sponsor_entity_id UUID REFERENCES entities(id),
    document_url TEXT,
    introduced_date DATE,
    last_action_date DATE,
    ai_relevance_score FLOAT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX policies_status_idx ON policies(status, last_action_date DESC);
CREATE INDEX policies_search_idx ON policies USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to policies"
    ON policies FOR SELECT
    TO anon, authenticated
    USING (true);
