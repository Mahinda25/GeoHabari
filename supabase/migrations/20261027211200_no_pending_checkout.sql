ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

CREATE OR REPLACE FUNCTION fulfill_paystack_transaction(
  p_order JSONB,
  p_provider_reference TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_channel TEXT,
  p_paid_at TIMESTAMPTZ,
  p_raw_payload JSONB,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_payment payments%ROWTYPE;
  v_ticket_type ticket_types%ROWTYPE;
  v_event events%ROWTYPE;
  v_tickets JSONB := '[]'::jsonb;
  v_already_processed BOOLEAN := FALSE;
  v_payment_status TEXT;
  v_ticket_count INTEGER;
  v_index INTEGER;
  v_quantity INTEGER;
  v_amount INTEGER;
  v_reference TEXT;
  v_student_verification_id UUID;
  v_order_exists BOOLEAN := FALSE;
BEGIN
  v_reference := NULLIF(p_order->>'reference', '');
  v_quantity := NULLIF(p_order->>'quantity', '')::INTEGER;
  v_amount := NULLIF(p_order->>'amount', '')::INTEGER;

  IF p_status NOT IN ('paid', 'cancelled')
    OR v_reference IS NULL
    OR p_provider_reference IS DISTINCT FROM v_reference
    OR v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 5
    OR v_amount IS NULL OR v_amount < 0
    OR p_currency IS DISTINCT FROM 'KES'
    OR p_order->>'payment_method' NOT IN ('mobile_money', 'card')
    OR COALESCE((p_order->>'accepted_terms')::BOOLEAN, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'Invalid Paystack fulfillment details.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_reference, 0));

  SELECT * INTO v_order
  FROM orders
  WHERE reference = v_reference
  FOR UPDATE;
  v_order_exists := FOUND;

  IF v_order_exists AND v_order.payment_provider IS DISTINCT FROM 'paystack' THEN
    RAISE EXCEPTION 'Paystack transaction does not belong to a Paystack order.';
  END IF;

  IF v_order_exists THEN
    v_quantity := v_order.quantity;
    v_amount := v_order.amount;
    IF v_order.event_id IS DISTINCT FROM p_order->>'event_id'
      OR v_order.ticket_type_id IS DISTINCT FROM p_order->>'ticket_type_id' THEN
      RAISE EXCEPTION 'Paystack checkout metadata does not match the stored order.';
    END IF;
  END IF;

  SELECT * INTO v_ticket_type
  FROM ticket_types
  WHERE id = CASE WHEN v_order_exists THEN v_order.ticket_type_id ELSE p_order->>'ticket_type_id' END
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paystack ticket type could not be resolved.';
  END IF;

  SELECT * INTO v_event
  FROM events
  WHERE id = CASE WHEN v_order_exists THEN v_order.event_id ELSE p_order->>'event_id' END;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paystack event could not be resolved.';
  END IF;

  IF v_ticket_type.event_id IS DISTINCT FROM v_event.id
    OR v_amount <> v_ticket_type.price * v_quantity THEN
    RAISE EXCEPTION 'Paystack order amount or ticket selection does not match the database price.';
  END IF;

  IF p_status = 'paid' AND (
    p_amount IS NULL
    OR p_amount <> v_amount
    OR p_channel IS NULL
    OR p_channel NOT IN ('mobile_money', 'card')
  ) THEN
    RAISE EXCEPTION 'Verified Paystack amount or channel does not match the order.';
  END IF;

  IF p_status = 'paid'
    AND v_ticket_type.category_type = 'professional'
    AND (
      NULLIF(p_order->>'organization', '') IS NULL
      OR NULLIF(p_order->>'role', '') IS NULL
    ) THEN
    RAISE EXCEPTION 'Professional organization and role are required.';
  END IF;

  v_payment_status := CASE WHEN p_status = 'paid' THEN 'paid' ELSE 'failed' END;

  IF v_order.id IS NULL THEN
    v_student_verification_id := NULLIF(p_order->>'student_verification_id', '')::UUID;
    INSERT INTO orders (
      id, reference, event_id, ticket_type_id, buyer_name, email, phone,
      quantity, amount, status, payment_method, payment_provider,
      accepted_terms, organization, role, attendees, student_verification_id,
      created_at, updated_at
    )
    VALUES (
      (p_order->>'id')::UUID,
      v_reference,
      v_event.id,
      v_ticket_type.id,
      p_order->>'buyer_name',
      p_order->>'email',
      p_order->>'phone',
      v_quantity,
      v_amount,
      p_status,
      p_order->>'payment_method',
      'paystack',
      TRUE,
      NULLIF(p_order->>'organization', ''),
      NULLIF(p_order->>'role', ''),
      COALESCE(p_order->'attendees', '[]'::JSONB),
      v_student_verification_id,
      NOW(),
      NOW()
    )
    RETURNING * INTO v_order;
  ELSE
    IF v_order.status = 'paid' THEN
      SELECT COUNT(*) INTO v_ticket_count FROM tickets WHERE order_id = v_order.id;
      IF v_ticket_count >= v_order.quantity OR p_status = 'cancelled' THEN
        SELECT * INTO v_payment
        FROM payments
        WHERE order_id = v_order.id AND provider = 'paystack'
        ORDER BY created_at DESC
        LIMIT 1;
        SELECT COALESCE(JSONB_AGG(TO_JSONB(t) ORDER BY t.created_at), '[]'::JSONB)
        INTO v_tickets FROM tickets t WHERE t.order_id = v_order.id;
        RETURN JSONB_BUILD_OBJECT(
          'order', TO_JSONB(v_order),
          'payment', TO_JSONB(v_payment),
          'tickets', v_tickets,
          'alreadyProcessed', TRUE
        );
      END IF;
    END IF;

    UPDATE orders
    SET status = p_status, updated_at = NOW()
    WHERE id = v_order.id
    RETURNING * INTO v_order;
  END IF;

  SELECT * INTO v_payment
  FROM payments
  WHERE order_id = v_order.id AND provider = 'paystack'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    UPDATE payments
    SET provider_reference = p_provider_reference,
        amount = v_amount,
        status = v_payment_status,
        currency = p_currency,
        channel = p_channel,
        paid_at = CASE WHEN p_status = 'paid' THEN p_paid_at ELSE NULL END,
        raw_payload = p_raw_payload,
        updated_at = NOW()
    WHERE id = v_payment.id
    RETURNING * INTO v_payment;
  ELSE
    INSERT INTO payments (
      order_id, provider, provider_reference, amount, status,
      currency, channel, paid_at, raw_payload, created_at, updated_at
    )
    VALUES (
      v_order.id, 'paystack', p_provider_reference, v_amount, v_payment_status,
      p_currency, p_channel,
      CASE WHEN p_status = 'paid' THEN p_paid_at ELSE NULL END,
      p_raw_payload, NOW(), NOW()
    )
    RETURNING * INTO v_payment;
  END IF;

  IF p_status = 'paid' THEN
    IF v_order.student_verification_id IS NOT NULL THEN
      PERFORM 1 FROM student_verifications
      WHERE id = v_order.student_verification_id
        AND status = 'approved'
      FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Student verification is no longer approved.';
      END IF;
      IF EXISTS (
        SELECT 1 FROM student_verifications
        WHERE id = v_order.student_verification_id
          AND consumed_by_order_id IS NOT NULL
          AND consumed_by_order_id <> v_order.id
          AND EXISTS (
            SELECT 1 FROM orders
            WHERE id = student_verifications.consumed_by_order_id
              AND status = 'paid'
          )
      ) THEN
        RAISE EXCEPTION 'Student verification has already been used for a paid order.';
      END IF;
      UPDATE student_verifications
      SET consumed_by_order_id = v_order.id, updated_at = NOW()
      WHERE id = v_order.student_verification_id;
    END IF;

    SELECT COUNT(*) INTO v_ticket_count FROM tickets WHERE order_id = v_order.id;
    FOR v_index IN (v_ticket_count + 1)..v_order.quantity LOOP
      INSERT INTO tickets (
        order_id, event_id, ticket_type_id, ticket_code, category, category_type,
        attendee_name, attendee_email, attendee_phone, organization, role
      )
      VALUES (
        v_order.id,
        v_order.event_id,
        v_order.ticket_type_id,
        'TCK-2026-' || UPPER(REPLACE(gen_random_uuid()::TEXT, '-', '')),
        v_ticket_type.name,
        v_ticket_type.category_type,
        v_order.buyer_name,
        v_order.email,
        v_order.phone,
        CASE WHEN v_ticket_type.category_type = 'professional' THEN v_order.organization END,
        CASE WHEN v_ticket_type.category_type = 'professional' THEN v_order.role END
      );
    END LOOP;

    IF v_ticket_count < v_order.quantity THEN
      UPDATE ticket_types
      SET sold_count = sold_count + (v_order.quantity - v_ticket_count),
          updated_at = NOW()
      WHERE id = v_ticket_type.id;
    END IF;
  END IF;

  SELECT COALESCE(JSONB_AGG(TO_JSONB(t) ORDER BY t.created_at), '[]'::JSONB)
  INTO v_tickets
  FROM tickets t
  WHERE t.order_id = v_order.id;

  RETURN JSONB_BUILD_OBJECT(
    'order', TO_JSONB(v_order),
    'payment', TO_JSONB(v_payment),
    'tickets', v_tickets,
    'alreadyProcessed', FALSE
  );
END;
$$;

REVOKE ALL ON FUNCTION fulfill_paystack_transaction(
  JSONB, TEXT, NUMERIC, TEXT, TEXT, TIMESTAMPTZ, JSONB, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fulfill_paystack_transaction(
  JSONB, TEXT, NUMERIC, TEXT, TEXT, TIMESTAMPTZ, JSONB, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION create_ticket_order_with_payment(JSONB, JSONB) FROM service_role;
REVOKE ALL ON FUNCTION confirm_paystack_ticket_order(TEXT, TEXT, NUMERIC, TEXT) FROM service_role;
REVOKE ALL ON FUNCTION confirm_paystack_webhook_ticket_order(
  TEXT, TEXT, NUMERIC, TEXT, TEXT, TIMESTAMPTZ, JSONB
) FROM service_role;
