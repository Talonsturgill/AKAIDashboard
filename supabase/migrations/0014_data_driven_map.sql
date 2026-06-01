-- 0014_data_driven_map.sql
--
-- Moves three sources of truth out of hardcoded constants in the codebase
-- and into the database so future additions made by routines show up on the
-- /command map without code touches:
--
--   1. entities.headquarters_latitude / longitude
--        replaces ENTITY_HQ_FALLBACK map in components/command/DeckOverlay.tsx
--        used by the ARCS overlay to draw arcs to entities that have no
--        infrastructure_projects row of their own
--
--   2. fiber_routes table
--        replaces FIBER_ROUTES const in lib/command/constants.ts
--        every long-haul cable polyline drawn on the basemap
--
--   3. infrastructure_projects.display_radius_km
--        replaces MILITARY_RINGS const in lib/command/constants.ts
--        any project with a value gets a dashed territory ring on the map

-- =============================================================================
-- 1. Entity headquarters coordinates
-- =============================================================================

ALTER TABLE entities
    ADD COLUMN IF NOT EXISTS headquarters_latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS headquarters_longitude DOUBLE PRECISION;

-- Seed with the values previously in ENTITY_HQ_FALLBACK so the map keeps
-- rendering arcs for the same entities post-migration. Each UPDATE no-ops
-- if the slug isn't present in the entities table yet.
DO $$
DECLARE
    seed RECORD;
BEGIN
    FOR seed IN
        SELECT slug, lon, lat FROM (VALUES
            ('nana-regional-corporation',                                61.2,   -149.9),
            ('doyon-limited',                                            64.84,  -147.72),
            ('sealaska-corporation',                                     58.3,   -134.42),
            ('chugach-alaska-corporation',                               61.2,   -149.9),
            ('calista-corporation',                                      61.2,   -149.9),
            ('cook-inlet-region-inc',                                    61.2,   -149.9),
            ('bering-straits-native-corporation',                        64.5,   -165.41),
            ('bristol-bay-native-corporation',                           61.2,   -149.9),
            ('the-aleut-corporation',                                    61.2,   -149.9),
            ('koniag-inc',                                               57.79,  -152.4),
            ('gci-communication-corp',                                   61.2,   -149.9),
            ('alaska-communications-systems',                            61.2,   -149.9),
            ('matanuska-telecom-association',                            61.6,   -149.1),
            ('university-of-alaska-anchorage',                           61.19,  -149.83),
            ('university-of-alaska-fairbanks',                           64.86,  -147.85),
            ('university-of-alaska-southeast',                           58.3,   -134.42),
            ('alaska-pacific-university',                                61.19,  -149.81),
            ('alaska-industrial-development-and-export-authority',       61.2,   -149.9),
            ('alaska-energy-authority',                                  61.2,   -149.9),
            ('alaska-dcced',                                             58.3,   -134.42),
            ('alaska-dot-pf',                                            58.3,   -134.42),
            ('joint-base-elmendorf-richardson',                          61.3,   -149.71),
            ('eielson-air-force-base',                                   64.66,  -147.05),
            ('noaa-alaska-regional-office',                              58.3,   -134.42),
            ('usgs-alaska-science-center',                               61.2,   -149.9),
            ('quintillion',                                              61.2,   -149.9),
            ('alcan-one',                                                64.75,  -147.35),
            ('alaska-federation-of-natives',                             61.2,   -149.9),
            ('cook-inlet-tribal-council',                                61.2,   -149.9),
            ('tanana-chiefs-conference',                                 64.84,  -147.72),
            ('association-of-village-council-presidents',                60.79,  -161.76),
            ('bristol-bay-native-association',                           59.04,  -158.46),
            ('alaska-bead-program',                                      61.2,   -149.9)
        ) AS s(slug, lat, lon)
    LOOP
        UPDATE entities
        SET headquarters_latitude  = seed.lat,
            headquarters_longitude = seed.lon
        WHERE slug = seed.slug
          AND headquarters_latitude IS NULL
          AND headquarters_longitude IS NULL;
    END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS entities_hq_coords_idx
    ON entities (headquarters_latitude, headquarters_longitude)
    WHERE headquarters_latitude IS NOT NULL
      AND headquarters_longitude IS NOT NULL;

-- =============================================================================
-- 2. fiber_routes table
-- =============================================================================

CREATE TABLE IF NOT EXISTS fiber_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    operator_entity_id UUID REFERENCES entities(id),
    waypoints JSONB NOT NULL,        -- array of [latitude, longitude] pairs
    color TEXT DEFAULT '#22d3ee',
    weight NUMERIC DEFAULT 2.0,
    status TEXT DEFAULT 'operational'
        CHECK (status IN ('operational', 'construction', 'proposed', 'permitting', 'decommissioned')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fiber_routes_status_idx ON fiber_routes (status);
CREATE INDEX IF NOT EXISTS fiber_routes_operator_idx ON fiber_routes (operator_entity_id);

ALTER TABLE fiber_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY fiber_routes_public_read ON fiber_routes
    FOR SELECT TO anon, authenticated USING (true);

-- Audit + human_verified guard, matching the pattern in 0013
DROP TRIGGER IF EXISTS audit_fiber_routes ON fiber_routes;
CREATE TRIGGER audit_fiber_routes
    AFTER INSERT OR UPDATE OR DELETE ON fiber_routes
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();

DROP TRIGGER IF EXISTS protect_verified_fiber_routes ON fiber_routes;
CREATE TRIGGER protect_verified_fiber_routes
    BEFORE UPDATE OR DELETE ON fiber_routes
    FOR EACH ROW EXECUTE FUNCTION protect_human_verified();

-- Seed with the previously hardcoded routes from lib/command/constants.ts.
-- Waypoints stay as [lat, lng] pairs, matching how Leaflet's L.polyline reads them.
INSERT INTO fiber_routes (slug, name, operator_entity_id, waypoints, color, weight, status, metadata)
VALUES
    ('quintillion',
     'Quintillion subsea cable',
     (SELECT id FROM entities WHERE slug = 'quintillion'),
     '[[64.5,-165.41],[66.9,-162.6],[68.35,-166.81],[70.65,-160.04],[71.29,-156.79],[70.32,-148.4]]'::jsonb,
     '#22d3ee', 2.5, 'operational',
     '{"verification":{"source":"seed_from_constants_2026-05-31","human_verified":true}}'::jsonb),
    ('alcan-one',
     'AlCan ONE terrestrial fiber',
     (SELECT id FROM entities WHERE slug = 'alcan-one'),
     '[[64.75,-147.35],[64.04,-145.73],[63.34,-142.99],[62.38,-140.87]]'::jsonb,
     '#22d3ee', 2.5, 'construction',
     '{"verification":{"source":"seed_from_constants_2026-05-31","human_verified":true}}'::jsonb),
    ('airraq-bethel',    'AIRRAQ Bethel branch',    NULL, '[[59.04,-158.46],[60.79,-161.76]]'::jsonb, '#22d3ee', 2.0, 'proposed', '{"verification":{"source":"seed_from_constants_2026-05-31"}}'::jsonb),
    ('airraq-platinum',  'AIRRAQ Platinum branch',  NULL, '[[59.04,-158.46],[59.01,-161.82]]'::jsonb, '#22d3ee', 2.0, 'proposed', '{"verification":{"source":"seed_from_constants_2026-05-31"}}'::jsonb),
    ('airraq-eek',       'AIRRAQ Eek branch',       NULL, '[[59.04,-158.46],[60.22,-162.02]]'::jsonb, '#22d3ee', 2.0, 'proposed', '{"verification":{"source":"seed_from_constants_2026-05-31"}}'::jsonb),
    ('airraq-quinhagak', 'AIRRAQ Quinhagak branch', NULL, '[[59.04,-158.46],[59.75,-161.92]]'::jsonb, '#22d3ee', 2.0, 'proposed', '{"verification":{"source":"seed_from_constants_2026-05-31"}}'::jsonb),
    ('airraq-togiak',    'AIRRAQ Togiak branch',    NULL, '[[59.04,-158.46],[59.06,-160.39]]'::jsonb, '#22d3ee', 2.0, 'proposed', '{"verification":{"source":"seed_from_constants_2026-05-31"}}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 3. infrastructure_projects.display_radius_km
-- =============================================================================

ALTER TABLE infrastructure_projects
    ADD COLUMN IF NOT EXISTS display_radius_km NUMERIC
        CHECK (display_radius_km IS NULL OR display_radius_km > 0);

-- Seed: the three DAF EUL military data center sites previously enumerated
-- in MILITARY_RINGS (50 km radius each, matching the original 50000-meter
-- value). Match by name to stay loose against future renames.
UPDATE infrastructure_projects
SET display_radius_km = 50
WHERE display_radius_km IS NULL
  AND (name ILIKE '%JBER%' OR name ILIKE '%Eielson%' OR name ILIKE '%Clear%');
