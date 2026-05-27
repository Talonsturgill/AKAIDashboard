CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_entity_id UUID NOT NULL REFERENCES entities(id),
    to_entity_id UUID NOT NULL REFERENCES entities(id),
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'employs', 'contracts_with', 'partners_with', 'competes_with',
        'owns', 'regulates', 'funds', 'located_in', 'subsidiary_of',
        'awarded_to', 'invested_in', 'collaborates_with'
    )),
    strength FLOAT DEFAULT 0.5 CHECK (strength BETWEEN 0 AND 1),
    evidence_urls TEXT[] DEFAULT '{}',
    first_observed_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX relationships_from_idx ON relationships(from_entity_id);
CREATE INDEX relationships_to_idx ON relationships(to_entity_id);
CREATE INDEX relationships_strength_idx ON relationships(strength DESC);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to relationships"
    ON relationships FOR SELECT
    TO anon, authenticated
    USING (true);
