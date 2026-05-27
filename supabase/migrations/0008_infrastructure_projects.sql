CREATE TABLE infrastructure_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_type TEXT CHECK (project_type IN ('data_center', 'fiber', 'broadband', 'power', 'compute', 'satellite', 'other')),
    operator_entity_id UUID REFERENCES entities(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name TEXT,
    capacity_metric TEXT,
    capacity_value NUMERIC,
    status TEXT,
    announced_date DATE,
    operational_date DATE,
    estimated_cost NUMERIC(15, 2),
    source_urls TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX infra_type_status_idx ON infrastructure_projects(project_type, status);
CREATE INDEX infra_location_idx ON infrastructure_projects(latitude, longitude);

ALTER TABLE infrastructure_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to infrastructure_projects"
    ON infrastructure_projects FOR SELECT
    TO anon, authenticated
    USING (true);
