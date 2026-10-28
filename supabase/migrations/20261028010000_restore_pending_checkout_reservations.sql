ALTER TABLE IF EXISTS orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE IF EXISTS orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'))
  NOT VALID;

ALTER TABLE IF EXISTS orders
  VALIDATE CONSTRAINT orders_status_check;

ALTER TABLE IF EXISTS payments
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE IF EXISTS payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'))
  NOT VALID;

ALTER TABLE IF EXISTS payments
  VALIDATE CONSTRAINT payments_status_check;

REVOKE ALL ON FUNCTION create_ticket_order_with_payment(JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_ticket_order_with_payment(JSONB, JSONB) TO service_role;
