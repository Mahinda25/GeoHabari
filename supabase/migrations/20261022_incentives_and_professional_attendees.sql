-- =========================================================================
-- GeoHabari Ticketing System: Incentives and Professional Attendee Information
-- Migration: 20261022_incentives_and_professional_attendees.sql
-- =========================================================================

-- 1. Extend events table with incentives / special offers
ALTER TABLE IF EXISTS events
  ADD COLUMN IF NOT EXISTS incentives JSONB DEFAULT '[]'::jsonb;

-- 2. Extend ticket_types table with stable category_type ('professional', 'student', 'standard')
ALTER TABLE IF EXISTS ticket_types
  ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'standard';

-- 3. Extend orders table with Organization, Role, and granular attendee records
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]'::jsonb;

-- 4. Extend tickets table with per-ticket attendee identification, organization, and role
ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS attendee_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_email TEXT,
  ADD COLUMN IF NOT EXISTS attendee_phone TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'standard';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_category_type ON ticket_types(category_type);
