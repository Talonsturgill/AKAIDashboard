CREATE TABLE archive_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    source_platform TEXT NOT NULL CHECK (source_platform IN ('substack', 'linkedin', 'manual', 'other')),
    source_url TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    body TEXT NOT NULL,
    body_embedding vector(1536),
    author TEXT,
    cover_image_url TEXT,
    franchise TEXT,
    entities_mentioned UUID[] DEFAULT '{}',
    published_at TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX archive_published_idx ON archive_content(published_at DESC);
CREATE INDEX archive_embedding_idx ON archive_content USING hnsw (body_embedding vector_cosine_ops);
CREATE INDEX archive_search_idx ON archive_content USING gin(to_tsvector('english', title || ' ' || body));

ALTER TABLE archive_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to archive_content"
    ON archive_content FOR SELECT
    TO anon, authenticated
    USING (true);
