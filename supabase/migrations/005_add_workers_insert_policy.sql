-- ============================================
-- Migration 005: Add INSERT policy on workers table
-- 
-- The original schema.sql only had a SELECT policy
-- on workers, which caused all INSERT operations
-- (creating new workers) to be silently blocked by RLS.
-- ============================================

-- Allow anonymous inserts on workers (needed for kiosk admin and manager worker creation)
-- Use DO block to avoid error if policy already exists (e.g. from reset.sql)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workers' 
        AND policyname = 'Allow anonymous insert on workers'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow anonymous insert on workers" ON workers FOR INSERT WITH CHECK (true)';
    END IF;
END
$$;
