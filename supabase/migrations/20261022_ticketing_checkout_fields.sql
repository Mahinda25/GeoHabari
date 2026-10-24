ALTER TABLE IF EXISTS ticket_types
  ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'standard';

UPDATE ticket_types
SET category_type = CASE
  WHEN LOWER(name) LIKE '%student%' THEN 'student'
  WHEN LOWER(name) LIKE '%professional%' THEN 'professional'
  ELSE 'standard'
END
WHERE category_type = 'standard';

ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS attendee_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_email TEXT,
  ADD COLUMN IF NOT EXISTS attendee_phone TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS idx_orders_ticket_type_pending
  ON orders(ticket_type_id, status, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_reference_unique
  ON payments(provider, provider_reference)
  WHERE provider_reference <> '';
