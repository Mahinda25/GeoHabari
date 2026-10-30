CREATE TABLE IF NOT EXISTS student_email_otps (
  email TEXT PRIMARY KEY,
  otp_code TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INTEGER NOT NULL DEFAULT 0,
  send_attempts INTEGER NOT NULL DEFAULT 1,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  student_verification_id UUID UNIQUE REFERENCES student_verifications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_email_otps_expiry
  ON student_email_otps(expires_at);

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
    student_verification_id = verification_id,
    updated_at = NOW()
  WHERE email = verified_email;

  RETURN verification_id;
END;
$$;

REVOKE ALL ON FUNCTION verify_student_email_otp(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_student_email_otp(TEXT, TEXT) TO service_role;
