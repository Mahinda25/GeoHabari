-- =========================================================================
-- GeoHabari Ticketing System: Student Verifications & WhatsApp Notifications
-- Migration: 20261014_ticketing_verifications.sql
-- =========================================================================

-- 1. Extend orders table with WhatsApp and Student Verification fields
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_verification_id UUID;

-- 2. Student Verifications Table
CREATE TABLE IF NOT EXISTS student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method TEXT NOT NULL CHECK (method IN ('university_email', 'student_id_name_match')),
  buyer_name TEXT NOT NULL,
  email TEXT,
  code_hash TEXT,
  code_expires_at TIMESTAMPTZ,
  code_attempts INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'email_code_sent', 'email_verified', 'processing', 'approved', 'retry_required', 'rejected', 'expired')),
  document_storage_key TEXT,
  document_hash TEXT,
  document_mime TEXT,
  document_size INT,
  match_score NUMERIC(5,2),
  failure_reason TEXT,
  is_duplicate_flagged BOOLEAN DEFAULT FALSE,
  consumed_by_order_id UUID,
  verified_at TIMESTAMPTZ,
  retention_expires_at TIMESTAMPTZ,
  purged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and query lookup
CREATE INDEX IF NOT EXISTS idx_student_verifications_email ON student_verifications(email);
CREATE INDEX IF NOT EXISTS idx_student_verifications_status ON student_verifications(status);
CREATE INDEX IF NOT EXISTS idx_student_verifications_doc_hash ON student_verifications(document_hash);
CREATE INDEX IF NOT EXISTS idx_student_verifications_retention ON student_verifications(retention_expires_at) WHERE purged_at IS NULL;

-- 3. WhatsApp Notifications Table (with Idempotency Guard)
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  order_reference TEXT NOT NULL,
  phone TEXT NOT NULL,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped_no_consent', 'skipped_unconfigured')),
  provider TEXT,
  provider_message_id TEXT,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_whatsapp_order_id UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_phone ON whatsapp_notifications(phone);
