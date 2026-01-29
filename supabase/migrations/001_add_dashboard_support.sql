-- ============================================
-- ROME Migration 001: Dashboard Support
-- Adds locations, email/phone, time off requests
-- ============================================

-- ============================================
-- LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default location (only if not exists)
INSERT INTO locations (name, address) 
SELECT 'Edison Warehouse', '123 Warehouse Blvd, Edison, NJ 08817'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Edison Warehouse');

-- ============================================
-- UPDATE WORKERS TABLE
-- Add email, phone, location_id
-- ============================================

-- Add new columns to workers
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Update existing workers with the default location
UPDATE workers 
SET location_id = (SELECT id FROM locations LIMIT 1)
WHERE location_id IS NULL;

-- Add email index for login lookups
CREATE INDEX IF NOT EXISTS idx_workers_email ON workers(email);

-- Update seed data with emails (for testing)
UPDATE workers SET email = 'john.smith@example.com' WHERE pin = '123456' AND email IS NULL;
UPDATE workers SET email = 'maria.garcia@example.com' WHERE pin = '234567' AND email IS NULL;
UPDATE workers SET email = 'james.wilson@example.com', role = 'manager' WHERE pin = '345678';
UPDATE workers SET email = 'sarah.johnson@example.com' WHERE pin = '456789' AND email IS NULL;
UPDATE workers SET email = 'michael.brown@example.com' WHERE pin = '567890' AND email IS NULL;

-- ============================================
-- TIME OFF REQUESTS TABLE
-- ============================================
DO $$ BEGIN
    CREATE TYPE time_off_type AS ENUM (
        'vacation',
        'personal',
        'sick',
        'bereavement',
        'unpaid'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
        'pending',
        'approved',
        'denied'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    
    -- Request details
    type time_off_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    paid_hours DECIMAL(5,2) DEFAULT 0,
    unpaid_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Excused/Planned tracking
    is_excused BOOLEAN DEFAULT true,
    is_planned BOOLEAN DEFAULT true,
    
    -- Comments
    comments TEXT,
    
    -- Approval workflow
    status request_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES workers(id),
    reviewed_at TIMESTAMPTZ,
    denial_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_time_off_worker ON time_off_requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_time_off_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_dates ON time_off_requests(start_date, end_date);

-- ============================================
-- VERIFICATION CODES TABLE
-- For email verification during login
-- ============================================
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    code CHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_worker ON verification_codes(worker_id);
CREATE INDEX IF NOT EXISTS idx_verification_code ON verification_codes(code);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Allow anonymous read on locations" ON locations;
DROP POLICY IF EXISTS "Workers can read own time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Workers can insert own time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Allow updates on time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Allow insert on verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Allow read on verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Allow update on verification codes" ON verification_codes;

-- Locations: readable by all
CREATE POLICY "Allow anonymous read on locations" ON locations
    FOR SELECT USING (true);

-- Time off requests: full access for kiosk operations
CREATE POLICY "Workers can read own time off requests" ON time_off_requests
    FOR SELECT USING (true);

CREATE POLICY "Workers can insert own time off requests" ON time_off_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updates on time off requests" ON time_off_requests
    FOR UPDATE USING (true);

-- Verification codes
CREATE POLICY "Allow insert on verification codes" ON verification_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read on verification codes" ON verification_codes
    FOR SELECT USING (true);

CREATE POLICY "Allow update on verification codes" ON verification_codes
    FOR UPDATE USING (true);

-- ============================================
-- CONFIRMATION
-- ============================================
SELECT 'Migration 001 complete! New tables: locations, time_off_requests, verification_codes' as status;
