-- ============================================
-- ROME Warehouse Management System
-- RESET SCRIPT - Drops and recreates everything
-- ============================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS production_logs CASCADE;
DROP TABLE IF EXISTS punches CASCADE;
DROP TABLE IF EXISTS workers CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS punch_type CASCADE;

-- Now run the full schema creation
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WORKERS TABLE
-- ============================================
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin CHAR(6) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'worker',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workers_pin ON workers(pin);

-- ============================================
-- PUNCHES TABLE
-- ============================================
CREATE TYPE punch_type AS ENUM ('IN', 'OUT');

CREATE TABLE punches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    type punch_type NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_punches_worker_id ON punches(worker_id);
CREATE INDEX idx_punches_timestamp ON punches(timestamp DESC);
CREATE INDEX idx_punches_worker_timestamp ON punches(worker_id, timestamp DESC);

-- ============================================
-- PRODUCTION LOGS TABLE
-- ============================================
CREATE TABLE production_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    task_name VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_logs_worker_id ON production_logs(worker_id);
CREATE INDEX idx_production_logs_timestamp ON production_logs(timestamp DESC);
CREATE INDEX idx_production_logs_task ON production_logs(task_name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;

-- Policies for kiosk operations
CREATE POLICY "Allow anonymous read on workers" ON workers
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on workers" ON workers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on punches" ON punches
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read on punches" ON punches
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on production_logs" ON production_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read on production_logs" ON production_logs
    FOR SELECT USING (true);

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO workers (pin, full_name, role) VALUES
    ('123456', 'John Smith', 'worker'),
    ('234567', 'Maria Garcia', 'worker'),
    ('345678', 'James Wilson', 'supervisor'),
    ('456789', 'Sarah Johnson', 'worker'),
    ('567890', 'Michael Brown', 'worker');

-- Confirmation
SELECT 'Database reset complete! ' || COUNT(*) || ' workers created.' as status FROM workers;
