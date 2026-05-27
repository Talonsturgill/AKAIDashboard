CREATE OR REPLACE FUNCTION universal_search(
    query_text TEXT,
    query_embedding vector(1536),
    match_count INT DEFAULT 20
) RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    snippet TEXT,
    url_path TEXT,
    score FLOAT
)
LANGUAGE SQL STABLE
SET search_path = public
AS $$
    WITH
    archive_results AS (
        SELECT
            ac.id,
            'archive'::TEXT AS type,
            ac.title,
            substring(ac.body, 1, 200) AS snippet,
            '/archive/' || ac.id::TEXT AS url_path,
            (CASE
                WHEN ac.body_embedding IS NULL THEN 0
                ELSE (1 - (ac.body_embedding <=> query_embedding))
            END) * 0.5 +
            ts_rank_cd(to_tsvector('english', ac.title || ' ' || ac.body), plainto_tsquery('english', query_text)) * 0.5 AS score
        FROM archive_content ac
        WHERE to_tsvector('english', ac.title || ' ' || ac.body) @@ plainto_tsquery('english', query_text)
           OR (ac.body_embedding IS NOT NULL AND ac.body_embedding <=> query_embedding < 0.5)
        ORDER BY score DESC
        LIMIT 10
    ),
    entity_results AS (
        SELECT
            e.id,
            'entity'::TEXT AS type,
            e.name AS title,
            COALESCE(e.description, '') AS snippet,
            '/companies/' || e.id::TEXT AS url_path,
            ts_rank_cd(to_tsvector('english', e.name || ' ' || COALESCE(e.description, '')), plainto_tsquery('english', query_text))::float8 AS score
        FROM entities e
        WHERE to_tsvector('english', e.name || ' ' || COALESCE(e.description, '')) @@ plainto_tsquery('english', query_text)
        ORDER BY score DESC
        LIMIT 5
    ),
    contract_results AS (
        SELECT
            c.id,
            'contract'::TEXT AS type,
            c.title,
            COALESCE(c.description, '') AS snippet,
            '/contracts/' || c.id::TEXT AS url_path,
            ts_rank_cd(to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')), plainto_tsquery('english', query_text))::float8 AS score
        FROM contracts c
        WHERE to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery('english', query_text)
        ORDER BY score DESC
        LIMIT 5
    ),
    policy_results AS (
        SELECT
            p.id,
            'policy'::TEXT AS type,
            p.title,
            COALESCE(p.description, '') AS snippet,
            '/policy/' || p.id::TEXT AS url_path,
            ts_rank_cd(to_tsvector('english', p.title || ' ' || COALESCE(p.description, '')), plainto_tsquery('english', query_text))::float8 AS score
        FROM policies p
        WHERE to_tsvector('english', p.title || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('english', query_text)
        ORDER BY score DESC
        LIMIT 5
    )
    SELECT * FROM (
        SELECT * FROM archive_results
        UNION ALL
        SELECT * FROM entity_results
        UNION ALL
        SELECT * FROM contract_results
        UNION ALL
        SELECT * FROM policy_results
    ) combined
    ORDER BY score DESC
    LIMIT match_count;
$$;
