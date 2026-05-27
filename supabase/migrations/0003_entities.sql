CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN (
        'company', 'person', 'project', 'agency', 'anc',
        'university', 'infrastructure', 'tribe', 'contract_holder'
    )),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    aliases TEXT[] DEFAULT '{}',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    relevance_score FLOAT DEFAULT 0.5,
    last_mentioned_at TIMESTAMPTZ,
    mention_count INTEGER DEFAULT 0,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX entities_type_relevance_idx ON entities(type, relevance_score DESC);
CREATE INDEX entities_name_idx ON entities USING gin(to_tsvector('english', name));
CREATE INDEX entities_embedding_idx ON entities USING hnsw (embedding vector_cosine_ops);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to entities"
    ON entities FOR SELECT
    TO anon, authenticated
    USING (true);
