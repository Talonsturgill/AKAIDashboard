CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE,
    awarding_entity_id UUID REFERENCES entities(id),
    winning_entity_id UUID REFERENCES entities(id),
    contract_value NUMERIC(15, 2),
    contract_type TEXT CHECK (contract_type IN ('state', 'federal', 'military', 'anc', 'municipal')),
    title TEXT NOT NULL,
    description TEXT,
    ai_relevance_score FLOAT,
    solicitation_url TEXT,
    award_date DATE,
    period_of_performance DATERANGE,
    status TEXT CHECK (status IN ('solicitation', 'awarded', 'in_progress', 'completed', 'cancelled')),
    source_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX contracts_value_idx ON contracts(contract_value DESC, status);
CREATE INDEX contracts_ai_relevance_idx ON contracts(ai_relevance_score DESC) WHERE ai_relevance_score > 0.6;
CREATE INDEX contracts_search_idx ON contracts USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to contracts"
    ON contracts FOR SELECT
    TO anon, authenticated
    USING (true);
