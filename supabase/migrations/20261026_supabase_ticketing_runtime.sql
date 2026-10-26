-- Runtime fields used by the Astro server and private Supabase Storage buckets.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  poster TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  speakers JSONB NOT NULL DEFAULT '[]'::jsonb,
  partners JSONB NOT NULL DEFAULT '[]'::jsonb,
  incentives JSONB NOT NULL DEFAULT '[]'::jsonb,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL DEFAULT 'standard',
  price INTEGER NOT NULL CHECK (price >= 0),
  allocation INTEGER NOT NULL DEFAULT 100 CHECK (allocation >= 0),
  sold_count INTEGER NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method TEXT NOT NULL CHECK (method IN ('university_email', 'student_id_name_match')),
  buyer_name TEXT NOT NULL,
  email TEXT,
  code_hash TEXT,
  code_expires_at TIMESTAMPTZ,
  code_attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'email_code_sent', 'email_verified', 'processing', 'approved', 'retry_required', 'rejected', 'expired')
  ),
  document_storage_key TEXT,
  document_hash TEXT,
  document_mime TEXT,
  document_size INTEGER,
  extracted_text_preview TEXT,
  match_score NUMERIC(5, 2),
  failure_reason TEXT,
  is_duplicate_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  consumed_by_order_id UUID,
  verified_at TIMESTAMPTZ,
  retention_expires_at TIMESTAMPTZ,
  purged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id),
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
  buyer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 5),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT NOT NULL,
  payment_provider TEXT,
  accepted_terms BOOLEAN NOT NULL DEFAULT TRUE,
  organization TEXT,
  role TEXT,
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  student_verification_id UUID,
  payment_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('paystack', 'mpesa', 'card', 'pesapal')),
  provider_reference TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id),
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
  ticket_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  category_type TEXT NOT NULL DEFAULT 'standard',
  attendee_name TEXT,
  attendee_email TEXT,
  attendee_phone TEXT,
  organization TEXT,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
  check_in_status TEXT NOT NULL DEFAULT 'not_checked_in' CHECK (check_in_status IN ('not_checked_in', 'checked_in')),
  check_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'auditor')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS events
  ADD COLUMN IF NOT EXISTS speakers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS partners JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS incentives JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS ticket_types
  ADD COLUMN IF NOT EXISTS category_type TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_verification_id UUID,
  ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE IF EXISTS payments
  ADD CONSTRAINT payments_provider_check CHECK (provider IN ('paystack', 'mpesa', 'card', 'pesapal')),
  ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'failed', 'cancelled'));

ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS attendee_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_email TEXT,
  ADD COLUMN IF NOT EXISTS attendee_phone TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS category_type TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS check_in_status TEXT NOT NULL DEFAULT 'not_checked_in',
  ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checked_in_by TEXT;

ALTER TABLE IF EXISTS student_verifications
  ADD COLUMN IF NOT EXISTS extracted_text_preview TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS ticket_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format TEXT NOT NULL DEFAULT 'csv',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rows INTEGER NOT NULL DEFAULT 0 CHECK (rows >= 0)
);

GRANT ALL ON TABLE
  events, ticket_types, orders, payments, tickets, audit_logs, login_attempts,
  admin_users, admin_sessions, student_verifications, ticket_exports
TO service_role;
REVOKE ALL ON TABLE
  events, ticket_types, orders, payments, tickets, audit_logs, login_attempts,
  admin_users, admin_sessions, student_verifications, ticket_exports
FROM anon, authenticated;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_exports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_orders_payment_expiry
  ON orders(ticket_type_id, status, payment_expires_at);
CREATE INDEX IF NOT EXISTS idx_student_verifications_retention_runtime
  ON student_verifications(retention_expires_at) WHERE purged_at IS NULL;

-- Event posters are public; student identity documents remain private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-posters', 'event-posters', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

CREATE OR REPLACE FUNCTION create_ticket_order_with_payment(p_order JSONB, p_payment JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_ticket_type ticket_types%ROWTYPE;
  v_verification student_verifications%ROWTYPE;
  v_verification_id UUID;
  v_reserved BIGINT;
BEGIN
  SELECT * INTO v_ticket_type
  FROM ticket_types
  WHERE id = p_order->>'ticket_type_id'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected ticket type was not found.';
  END IF;
  IF v_ticket_type.event_id IS DISTINCT FROM (p_order->>'event_id')
    OR NOT EXISTS (
      SELECT 1 FROM events
      WHERE id = v_ticket_type.event_id AND status = 'published' AND archived_at IS NULL
    ) THEN
    RAISE EXCEPTION 'Event is not available for purchase.';
  END IF;
  IF p_order->>'status' IS DISTINCT FROM 'pending'
    OR p_payment->>'provider' IS DISTINCT FROM 'paystack'
    OR p_payment->>'status' IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'A pending Paystack order and payment are required.';
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
  FROM orders
  WHERE ticket_type_id = v_ticket_type.id
    AND status = 'pending'
    AND COALESCE(payment_expires_at, created_at + INTERVAL '20 minutes') > NOW();

  IF v_ticket_type.sold_count + v_reserved + (p_order->>'quantity')::INTEGER > v_ticket_type.allocation THEN
    RAISE EXCEPTION 'Selected ticket quantity exceeds remaining capacity.';
  END IF;

  v_verification_id := NULLIF(p_order->>'student_verification_id', '')::UUID;
  IF v_verification_id IS NOT NULL THEN
    SELECT * INTO v_verification
    FROM student_verifications
    WHERE id = v_verification_id
    FOR UPDATE;
    IF NOT FOUND OR v_verification.status <> 'approved' THEN
      RAISE EXCEPTION 'Student verification is no longer approved.';
    END IF;
    IF v_verification.consumed_by_order_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM orders
        WHERE id = v_verification.consumed_by_order_id AND status = 'paid'
      ) THEN
      RAISE EXCEPTION 'This student verification has already been utilized for a completed order.';
    END IF;
  END IF;

  INSERT INTO orders
  SELECT (jsonb_populate_record(NULL::orders, p_order)).* RETURNING * INTO v_order;
  INSERT INTO payments
  SELECT (jsonb_populate_record(NULL::payments, p_payment)).* RETURNING * INTO v_payment;

  IF v_verification_id IS NOT NULL THEN
    UPDATE student_verifications
    SET consumed_by_order_id = v_order.id, updated_at = NOW()
    WHERE id = v_verification_id;
  END IF;

  RETURN jsonb_build_object('order', to_jsonb(v_order), 'payment', to_jsonb(v_payment));
END;
$$;

CREATE OR REPLACE FUNCTION confirm_paystack_ticket_order(
  p_order_reference TEXT,
  p_provider_reference TEXT,
  p_amount NUMERIC,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_ticket_type ticket_types%ROWTYPE;
  v_ticket_count INTEGER;
  v_tickets JSONB := '[]'::jsonb;
  v_already_processed BOOLEAN := FALSE;
  v_payment_found BOOLEAN := FALSE;
  v_index INTEGER;
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('paid', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Unsupported payment status.';
  END IF;

  SELECT * INTO v_order
  FROM orders
  WHERE reference = p_order_reference
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;
  IF v_order.payment_provider IS DISTINCT FROM 'paystack' THEN
    RAISE EXCEPTION 'Payment provider does not match this order.';
  END IF;
  IF p_status = 'paid' AND (p_amount IS NULL OR p_amount <> v_order.amount) THEN
    RAISE EXCEPTION 'Verified payment amount does not match the order total.';
  END IF;

  IF p_provider_reference IS NOT NULL AND p_provider_reference <> '' AND EXISTS (
    SELECT 1 FROM payments
    WHERE provider = 'paystack'
      AND provider_reference = p_provider_reference
      AND order_id <> v_order.id
  ) THEN
    RAISE EXCEPTION 'Provider payment reference is already associated with another order.';
  END IF;

  SELECT * INTO v_payment
  FROM payments
  WHERE order_id = v_order.id AND provider = 'paystack'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;
  v_payment_found := FOUND;

  IF v_order.status = 'paid' AND p_status <> 'paid' THEN
    IF NOT v_payment_found THEN
      RAISE EXCEPTION 'Paid order is missing its payment record.';
    END IF;
    SELECT COALESCE(JSONB_AGG(TO_JSONB(t) ORDER BY t.created_at), '[]'::jsonb) INTO v_tickets
    FROM tickets t WHERE t.order_id = v_order.id;
    RETURN JSONB_BUILD_OBJECT(
      'order', TO_JSONB(v_order),
      'payment', TO_JSONB(v_payment),
      'tickets', v_tickets,
      'alreadyProcessed', TRUE
    );
  END IF;

  IF NOT v_payment_found THEN
    INSERT INTO payments (order_id, provider, provider_reference, amount, status)
    VALUES (
      v_order.id,
      'paystack',
      COALESCE(NULLIF(p_provider_reference, ''), v_order.reference),
      v_order.amount,
      p_status
    )
    RETURNING * INTO v_payment;
  ELSE
    UPDATE payments
    SET provider_reference = COALESCE(NULLIF(p_provider_reference, ''), provider_reference),
        amount = v_order.amount,
        status = p_status,
        updated_at = NOW()
    WHERE id = v_payment.id
    RETURNING * INTO v_payment;
  END IF;

  IF p_status = 'paid' THEN
    SELECT * INTO v_ticket_type
    FROM ticket_types
    WHERE id = v_order.ticket_type_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ticket type could not be resolved.';
    END IF;

    SELECT COUNT(*) INTO v_ticket_count FROM tickets WHERE order_id = v_order.id;
    IF v_order.status = 'paid' AND v_ticket_count > 0 THEN
      v_already_processed := TRUE;
    ELSE
      UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = v_order.id RETURNING * INTO v_order;
      FOR v_index IN 1..v_order.quantity LOOP
        INSERT INTO tickets (
          order_id, event_id, ticket_type_id, ticket_code, category, category_type,
          attendee_name, attendee_email, attendee_phone, organization, role
        )
        VALUES (
          v_order.id,
          v_order.event_id,
          v_order.ticket_type_id,
          'GH' || TO_CHAR(NOW(), 'YY') || '-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 16)),
          v_ticket_type.name,
          v_ticket_type.category_type,
          v_order.buyer_name,
          v_order.email,
          v_order.phone,
          CASE WHEN v_ticket_type.category_type = 'professional' THEN v_order.organization END,
          CASE WHEN v_ticket_type.category_type = 'professional' THEN v_order.role END
        );
      END LOOP;
      UPDATE ticket_types
      SET sold_count = sold_count + v_order.quantity, updated_at = NOW()
      WHERE id = v_ticket_type.id;
    END IF;
    SELECT COALESCE(JSONB_AGG(to_jsonb(t) ORDER BY t.created_at), '[]'::jsonb) INTO v_tickets
    FROM tickets t WHERE t.order_id = v_order.id;
  ELSE
    UPDATE orders SET status = p_status, updated_at = NOW() WHERE id = v_order.id RETURNING * INTO v_order;
  END IF;

  RETURN JSONB_BUILD_OBJECT(
    'order', TO_JSONB(v_order),
    'payment', TO_JSONB(v_payment),
    'tickets', v_tickets,
    'alreadyProcessed', v_already_processed
  );
END;
$$;

REVOKE ALL ON FUNCTION create_ticket_order_with_payment(JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION confirm_paystack_ticket_order(TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_ticket_order_with_payment(JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION confirm_paystack_ticket_order(TEXT, TEXT, NUMERIC, TEXT) TO service_role;
