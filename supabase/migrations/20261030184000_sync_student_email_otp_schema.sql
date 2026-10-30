ALTER TABLE student_email_otps
  ALTER COLUMN otp_code DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS send_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS student_verification_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS attempts_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ip_address TEXT;

DO $$
DECLARE
  constraint_name TEXT;
  column_type TEXT;
BEGIN
  SELECT data_type
  INTO column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'student_email_otps'
    AND column_name = 'student_verification_id';

  IF column_type IS DISTINCT FROM 'text' THEN
    FOR constraint_name IN
      SELECT constraint_row.conname
      FROM pg_constraint AS constraint_row
      JOIN pg_class AS table_row
        ON table_row.oid = constraint_row.conrelid
      JOIN pg_namespace AS schema_row
        ON schema_row.oid = table_row.relnamespace
      WHERE schema_row.nspname = 'public'
        AND table_row.relname = 'student_email_otps'
        AND constraint_row.contype = 'f'
        AND EXISTS (
          SELECT 1
          FROM unnest(constraint_row.conkey) AS key_column(attnum)
          JOIN pg_attribute AS column_row
            ON column_row.attrelid = table_row.oid
            AND column_row.attnum = key_column.attnum
          WHERE column_row.attname = 'student_verification_id'
        )
    LOOP
      EXECUTE format(
        'ALTER TABLE public.student_email_otps DROP CONSTRAINT %I',
        constraint_name
      );
    END LOOP;

    ALTER TABLE public.student_email_otps
      ALTER COLUMN student_verification_id TYPE TEXT
      USING student_verification_id::TEXT;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS student_email_otps_email_unique
  ON student_email_otps(email);

ALTER TABLE student_email_otps ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION verify_student_email_otp(p_email TEXT, p_otp TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  verification_id UUID;
  verified_email TEXT;
BEGIN
  SELECT email INTO verified_email
  FROM student_email_otps
  WHERE email = LOWER(TRIM(p_email))
    AND otp_code = p_otp
    AND verified = FALSE
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  verification_id := gen_random_uuid();

  INSERT INTO student_verifications (
    id,
    method,
    buyer_name,
    email,
    status,
    verified_at,
    created_at,
    updated_at
  )
  VALUES (
    verification_id,
    'university_email',
    'University email verified',
    verified_email,
    'approved',
    NOW(),
    NOW(),
    NOW()
  );

  UPDATE student_email_otps
  SET
    otp_code = NULL,
    verified = TRUE,
    verified_at = NOW(),
    student_verification_id = verification_id::TEXT,
    updated_at = NOW()
  WHERE email = verified_email;

  RETURN verification_id;
END;
$$;

REVOKE ALL ON FUNCTION verify_student_email_otp(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_student_email_otp(TEXT, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
