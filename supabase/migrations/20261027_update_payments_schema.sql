ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

CREATE OR REPLACE FUNCTION confirm_paystack_webhook_ticket_order(
  p_order_reference TEXT,
  p_provider_reference TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_channel TEXT,
  p_paid_at TIMESTAMPTZ,
  p_raw_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
  v_order_id UUID;
  v_tickets JSONB;
BEGIN
  v_result := confirm_paystack_ticket_order(
    p_order_reference,
    p_provider_reference,
    p_amount,
    'paid'
  );
  v_order_id := (v_result->'order'->>'id')::UUID;

  UPDATE payments
  SET currency = p_currency,
      channel = p_channel,
      paid_at = p_paid_at,
      raw_payload = p_raw_payload,
      updated_at = NOW()
  WHERE order_id = v_order_id
    AND provider = 'paystack';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paid order is missing its Paystack payment record.';
  END IF;

  IF NOT COALESCE((v_result->>'alreadyProcessed')::BOOLEAN, FALSE) THEN
    UPDATE tickets
    SET ticket_code = 'TCK-2026-' || UPPER(REPLACE(gen_random_uuid()::TEXT, '-', ''))
    WHERE order_id = v_order_id;
  END IF;

  SELECT COALESCE(JSONB_AGG(TO_JSONB(t) ORDER BY t.created_at), '[]'::jsonb)
  INTO v_tickets
  FROM tickets t
  WHERE t.order_id = v_order_id;

  RETURN JSONB_SET(v_result, '{tickets}', v_tickets, TRUE);
END;
$$;

REVOKE ALL ON FUNCTION confirm_paystack_webhook_ticket_order(
  TEXT, TEXT, NUMERIC, TEXT, TEXT, TIMESTAMPTZ, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_paystack_webhook_ticket_order(
  TEXT, TEXT, NUMERIC, TEXT, TEXT, TIMESTAMPTZ, JSONB
) TO service_role;
