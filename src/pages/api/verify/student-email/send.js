import {
  isValidUniversityEmail,
  generateVerificationCode,
  MAX_RESEND_ATTEMPTS,
} from '../../../../lib/student-verification.js';
import {
  getStudentEmailOtpByEmail,
  saveStudentEmailOtp,
  updateStudentEmailOtp,
} from '../../../../lib/ticketing-store.js';
import { sendUniversityVerificationEmail } from '../../../../lib/ticketing.js';

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const SEND_WINDOW_MS = 10 * 60 * 1000;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request, clientAddress }) {
  try {
    const apiKey = String(
      process.env.RESEND_API_KEY ||
      import.meta.env?.RESEND_API_KEY ||
      ''
    ).trim();
    const fromAddress = String(
      process.env.PUBLIC_RESEND_FROM ||
      import.meta.env?.PUBLIC_RESEND_FROM ||
      process.env.RESEND_FROM ||
      'GeoHabari Tickets <tickets@tickets.geohabari.com>'
    ).trim();

    if (!apiKey) {
      return jsonResponse({
        error: 'Student email verification is not configured. Set the server-side RESEND_API_KEY.',
      }, 503);
    }

    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!isValidUniversityEmail(email)) {
      return jsonResponse({
        error: 'A valid Kenyan university email ending in .ac.ke is required.',
      }, 400);
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const existing = await getStudentEmailOtpByEmail(email);
    const windowStartedAt = existing?.window_started_at
      ? new Date(existing.window_started_at)
      : null;
    const withinWindow = windowStartedAt &&
      now.getTime() - windowStartedAt.getTime() < SEND_WINDOW_MS;
    const sendAttempts = withinWindow ? Number(existing.send_attempts || 0) : 0;

    if (sendAttempts >= MAX_RESEND_ATTEMPTS) {
      return jsonResponse({
        error: 'Too many verification attempts. Please wait 10 minutes before requesting another code.',
      }, 429);
    }

    const otpCode = generateVerificationCode();
    const expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS).toISOString();
    const otpRecord = {
      email,
      otp_code: otpCode,
      expires_at: expiresAt,
      verified: false,
      attempts_count: 0,
      send_attempts: sendAttempts + 1,
      window_started_at: withinWindow ? existing.window_started_at : nowIso,
      student_verification_id: null,
      verified_at: null,
      ip_address: clientAddress || null,
      created_at: existing?.created_at || nowIso,
      updated_at: nowIso,
    };

    await saveStudentEmailOtp(otpRecord);

    try {
      await sendUniversityVerificationEmail({
        email,
        code: otpCode,
        apiKey,
        fromAddress,
      });
    } catch (error) {
      await updateStudentEmailOtp(email, {
        otp_code: null,
        expires_at: nowIso,
        updated_at: new Date().toISOString(),
      });
      console.error('[student-email/send] Email delivery failed:', error);
      return jsonResponse({
        error: 'The verification email could not be sent. Please try again later.',
      }, 503);
    }

    return jsonResponse({
      success: true,
      message: 'A verification code has been sent to your university email. It expires in 10 minutes.',
    });
  } catch (error) {
    console.error('[student-email/send] Request failed:', error);
    return jsonResponse({ error: 'Unable to send a verification code right now.' }, 500);
  }
}
