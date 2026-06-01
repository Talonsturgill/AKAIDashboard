-- 0013_data_integrity_guards.sql
-- Layer 3 of the routine-verification defense.
--
-- Adds:
--   * audit_log table — every INSERT/UPDATE/DELETE on the core data tables is
--     captured here by trigger, independent of what the writing routine reports.
--     Gives us a ledger we can diff even if a routine's own self-report lies.
--   * human_verified guard — any row whose metadata->>'human_verified' = 'true'
--     becomes immutable to subsequent UPDATE/DELETE except where the new row
--     also carries human_verified = 'true'. Protects the adversarially-checked
--     seed data from being silently overwritten by an agent.

-- =============================================================================
-- audit_log
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    row_id UUID,
    actor TEXT,                -- set via SET LOCAL "app.routine_name" = '...';
    old_row JSONB,
    new_row JSONB
);

CREATE INDEX IF NOT EXISTS audit_log_occurred_idx ON audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_table_idx ON audit_log (table_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor, occurred_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_public_read ON audit_log
    FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION write_audit_log() RETURNS TRIGGER AS $$
DECLARE
    actor_name TEXT;
BEGIN
    BEGIN
        actor_name := current_setting('app.routine_name', true);
    EXCEPTION WHEN OTHERS THEN
        actor_name := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (table_name, operation, row_id, actor, old_row, new_row)
        VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, actor_name, to_jsonb(OLD), NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (table_name, operation, row_id, actor, old_row, new_row)
        VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, actor_name, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (table_name, operation, row_id, actor, old_row, new_row)
        VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, actor_name, NULL, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'entities', 'relationships', 'archive_content',
        'contracts', 'policies', 'infrastructure_projects',
        'sources', 'dashboard_metrics'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON %I', t, t);
        EXECUTE format(
            'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I
             FOR EACH ROW EXECUTE FUNCTION write_audit_log()', t, t);
    END LOOP;
END $$;

-- =============================================================================
-- human_verified guard
-- =============================================================================
--
-- Routines must NEVER silently overwrite rows that a human has verified. To do
-- so deliberately, the writer must include metadata->>'human_verified' = 'true'
-- in the new row as well (effectively re-verifying the change).

CREATE OR REPLACE FUNCTION protect_human_verified() RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.metadata IS NOT NULL
        AND OLD.metadata->>'human_verified' = 'true'
        AND (NEW.metadata IS NULL
             OR NEW.metadata->>'human_verified' IS DISTINCT FROM 'true'))
    THEN
        RAISE EXCEPTION
            'Refusing to overwrite human_verified row %.% (id=%). Set new metadata.human_verified = true to override.',
            TG_TABLE_NAME, TG_OP, OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'entities', 'archive_content', 'contracts',
        'policies', 'infrastructure_projects'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS protect_verified_%I ON %I', t, t);
        EXECUTE format(
            'CREATE TRIGGER protect_verified_%I BEFORE UPDATE OR DELETE ON %I
             FOR EACH ROW EXECUTE FUNCTION protect_human_verified()', t, t);
    END LOOP;
END $$;
