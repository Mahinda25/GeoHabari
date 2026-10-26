import {
  isValidUniversityEmail,
  generateVerificationCode,
  hashVerificationCode,
  CODE_EXPIRY_MS,
  MAX_RESEND_ATTEMPTS,
  RETENTION_DAYS,
} from '../../../../lib/student-verification.js';
import {
  getStudentVerificationById,
  saveStudentVerification,
  listStudentVerifications,
  appendAuditLog,
} from '../../../../lib/ticketing-store.js';
import { sendUniversityVerificationEmail } from '../../../../lib/ticketing.js';

export async function POST({ request }) {
  if (!process.env.VERIFICATION_TOKEN_SECRET) {
    return new Response(JSON.stringify({
      error: 'Student verification is unavailable because token signing is not configured.',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const buyerName = String(body.buyer_name || '').trim();

    if (!buyerName || buyerName.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Full buyer name is required before requesting verification.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUniversityEmail(email)) {
      return new Response(
        JSON.stringify({
          error:
            'A valid Kenyan university email ending in .ac.ke is required (e.g. name@uonbi.ac.ke or student@strathmore.edu.ac.ke). Subdomains and lookalike addresses are strictly checked.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate-limiting check: count recent verification requests for this email
    const allVerifications = await listStudentVerifications();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const recentRequests = allVerifications.filter(
      (v) => v.email === email && v.created_at >= tenMinutesAgo
    );

    if (recentRequests.length >= MAX_RESEND_ATTEMPTS) {
      return new Response(
        JSON.stringify({
          error: 'Too many verification attempts for this university email. Please wait 10 minutes before requesting a new code.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate single-use numeric code and hash
    const plainCode = generateVerificationCode();
    const codeHash = hashVerificationCode(plainCode);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString();
    const retentionExpiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const verificationRecord = {
      id: crypto.randomUUID(),
      method: 'university_email',
      buyer_name: buyerName,
      email,
      code_hash: codeHash,
      code_expires_at: expiresAt,
      code_attempts: 0,
      status: 'email_code_sent',
      retention_expires_at: retentionExpiresAt,
      created_at: new Date().toISOString(),
    };

    await saveStudentVerification(verificationRecord);

    // Send code to student's email (non-blocking failure logging)
    try {
      await sendUniversityVerificationEmail({ email, buyerName, code: plainCode });
    } catch (error) {
      verificationRecord.status = 'expired';
      verificationRecord.code_hash = null;
      await saveStudentVerification(verificationRecord);
      await appendAuditLog({
        action: 'student_email_delivery_failed',
        entity: 'student_verification',
        entity_id: verificationRecord.id,
        details: { message: error.message },
      });
      return new Response(JSON.stringify({
        error: 'The verification email could not be sent. Please try again later or use another ticket category.',
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await appendAuditLog({
      action: 'student_email_code_dispatched',
      entity: 'student_verification',
      entity_id: verificationRecord.id,
      details: {
        domain: email.split('@')[1],
        expires_at: expiresAt,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        verification_id: verificationRecord.id,
        email_domain: email.split('@')[1],
        message: 'A single-use verification code has been dispatched to your .ac.ke university mailbox.',
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
