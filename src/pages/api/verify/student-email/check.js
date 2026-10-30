import { isValidUniversityEmail, MAX_VERIFICATION_ATTEMPTS } from '../../../../lib/student-verification.js';
import {
  getStudentEmailOtpByEmail,
  updateStudentEmailOtp,
  verifyStudentEmailOtp,
} from '../../../../lib/ticketing-store.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const otp = String(body.otp || '').trim();

    if (!isValidUniversityEmail(email) || !/^\d{6}$/.test(otp)) {
      return jsonResponse({
        error: 'A valid .ac.ke email and 6-digit verification code are required.',
      }, 400);
    }

    const otpRecord = await getStudentEmailOtpByEmail(email);
    if (!otpRecord?.otp_code || otpRecord.verified) {
      return jsonResponse({
        error: 'No active verification code was found. Request a new code.',
      }, 400);
    }

    if (new Date(otpRecord.expires_at).getTime() <= Date.now()) {
      await updateStudentEmailOtp(email, {
        otp_code: null,
        updated_at: new Date().toISOString(),
      });
      return jsonResponse({
        error: 'The verification code has expired. Request a new code.',
      }, 400);
    }

    const attempts = Number(otpRecord.attempts_count || 0);
    if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await updateStudentEmailOtp(email, {
        otp_code: null,
        expires_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return jsonResponse({
        error: 'Maximum verification attempts exceeded. Request a new code.',
      }, 429);
    }

    if (otpRecord.otp_code !== otp) {
      const nextAttempts = attempts + 1;
      const now = new Date().toISOString();
      await updateStudentEmailOtp(email, {
        attempts_count: nextAttempts,
        ...(nextAttempts >= MAX_VERIFICATION_ATTEMPTS
          ? { otp_code: null, expires_at: now }
          : {}),
        updated_at: now,
      });
      return jsonResponse({
        error: nextAttempts >= MAX_VERIFICATION_ATTEMPTS
          ? 'Maximum verification attempts exceeded. Request a new code.'
          : `Incorrect verification code. ${MAX_VERIFICATION_ATTEMPTS - nextAttempts} attempts remaining.`,
      }, nextAttempts >= MAX_VERIFICATION_ATTEMPTS ? 429 : 400);
    }

    const verificationId = await verifyStudentEmailOtp(email, otp);
    if (!verificationId) {
      return jsonResponse({
        error: 'The verification code is no longer valid. Request a new code.',
      }, 400);
    }

    return jsonResponse({
      success: true,
      verified: true,
      verification_id: verificationId,
      message: 'University email verified successfully.',
    });
  } catch (error) {
    console.error('[student-email/check] Request failed:', error);
    return jsonResponse({ error: 'Unable to verify this code right now.' }, 500);
  }
}
