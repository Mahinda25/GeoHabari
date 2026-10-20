import {
  verifyCodeHash,
  generateVerificationToken,
  MAX_VERIFICATION_ATTEMPTS,
} from '../../../../lib/student-verification.js';
import {
  getStudentVerificationById,
  saveStudentVerification,
  appendAuditLog,
} from '../../../../lib/ticketing-store.js';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const verificationId = String(body.verification_id || '').trim();
    const inputCode = String(body.code || '').trim();
    const buyerName = String(body.buyer_name || '').trim();

    if (!verificationId || !inputCode) {
      return new Response(
        JSON.stringify({ error: 'Verification ID and 6-digit code are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const record = getStudentVerificationById(verificationId);
    if (!record) {
      return new Response(
        JSON.stringify({ error: 'Verification session not found or expired.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (record.status === 'approved') {
      const { token } = generateVerificationToken(record.id, record.buyer_name, record.method);
      return new Response(
        JSON.stringify({
          success: true,
          status: 'approved',
          verification_id: record.id,
          verification_token: token,
          message: 'University email is already verified.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts limit
    record.code_attempts = Number(record.code_attempts || 0) + 1;
    if (record.code_attempts > MAX_VERIFICATION_ATTEMPTS) {
      record.status = 'expired';
      saveStudentVerification(record);
      return new Response(
        JSON.stringify({
          error: 'Maximum verification attempts exceeded. Please request a new code.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date(record.code_expires_at) < new Date()) {
      record.status = 'expired';
      saveStudentVerification(record);
      return new Response(
        JSON.stringify({ error: 'Verification code has expired. Please request a new code.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify hash
    const isValid = verifyCodeHash(inputCode, record.code_hash);
    if (!isValid) {
      saveStudentVerification(record);
      return new Response(
        JSON.stringify({
          error: `Incorrect verification code. ${MAX_VERIFICATION_ATTEMPTS - record.code_attempts} attempts remaining.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Approve verification
    record.status = 'approved';
    record.verified_at = new Date().toISOString();
    record.code_hash = null; // Invalidate OTP after consumption
    if (buyerName && buyerName.length >= 2) {
      record.buyer_name = buyerName;
    }
    saveStudentVerification(record);

    const { token, expiresAt } = generateVerificationToken(
      record.id,
      record.buyer_name,
      'university_email'
    );

    appendAuditLog({
      action: 'student_email_verified',
      entity: 'student_verification',
      entity_id: record.id,
      details: {
        domain: record.email ? record.email.split('@')[1] : null,
        method: 'university_email',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: 'approved',
        verification_id: record.id,
        verification_token: token,
        token_expires_at: expiresAt,
        message: 'University email verified successfully! Student ticket rate unlocked.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
