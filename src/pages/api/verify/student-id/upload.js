import {
  validateUploadedDocument,
  generateVerificationToken,
  RETENTION_DAYS,
} from '../../../../lib/student-verification.js';
import {
  savePrivateFile,
  calculateFileHash,
} from '../../../../lib/private-storage.js';
import {
  processDocumentOcr,
  matchStudentName,
} from '../../../../lib/ocr-service.js';
import {
  saveStudentVerification,
  getStudentVerificationByHash,
  appendAuditLog,
} from '../../../../lib/ticketing-store.js';

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
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Request must be multipart/form-data with a file.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const buyerName = String(formData.get('buyer_name') || '').trim();

    if (!buyerName || buyerName.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Full buyer name is required to match against your Student ID.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
      return new Response(
        JSON.stringify({ error: 'No student ID document was uploaded.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Rigorous multi-check validation (Size, Extension, Declared MIME, Magic bytes)
    const validation = validateUploadedDocument(buffer, file.type, file.name);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Cryptographic document hash
    const documentHash = calculateFileHash(buffer);

    // 3. Duplicate document & abuse prevention check
    const existingSubmission = await getStudentVerificationByHash(documentHash);
    let isFlaggedDuplicate = false;

    if (existingSubmission && existingSubmission.buyer_name.toLowerCase() !== buyerName.toLowerCase()) {
      isFlaggedDuplicate = true;
      await appendAuditLog({
        action: 'student_id_duplicate_detected',
        entity: 'student_verification',
        entity_id: existingSubmission.id,
        details: {
          original_buyer: existingSubmission.buyer_name,
          attempted_buyer: buyerName,
          hash: documentHash.slice(0, 16) + '...',
        },
      });
    }

    // 4. Save to private storage with random UUID
    const storageResult = await savePrivateFile(buffer, validation.extension, validation.detectedType);
    const retentionExpiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const verificationRecord = {
      id: crypto.randomUUID(),
      method: 'student_id_name_match',
      buyer_name: buyerName,
      document_storage_key: storageResult.storageKey,
      document_hash: documentHash,
      document_mime: validation.detectedType,
      document_size: buffer.length,
      status: 'processing',
      is_duplicate_flagged: isFlaggedDuplicate,
      retention_expires_at: retentionExpiresAt,
      created_at: new Date().toISOString(),
    };

    // If duplicate document was flagged with a different buyer name, do not auto-approve
    if (isFlaggedDuplicate) {
      verificationRecord.status = 'retry_required';
      verificationRecord.failure_reason = 'duplicate_document_different_applicant';
      await saveStudentVerification(verificationRecord);

      return new Response(
        JSON.stringify({
          success: false,
          status: 'retry_required',
          reason: 'This document has previously been submitted under another name. Please upload your personal student ID or verify via university email.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Run automated OCR
    const ocrResult = await processDocumentOcr(buffer, validation.detectedType);

    if (!ocrResult.success) {
      verificationRecord.status = 'retry_required';
      verificationRecord.failure_reason = ocrResult.reason;
      await saveStudentVerification(verificationRecord);

      return new Response(
        JSON.stringify({
          success: false,
          status: 'retry_required',
          reason: ocrResult.message || 'Automated OCR processing is unavailable. Please verify using your .ac.ke university email or select a Professional ticket.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Automated Name Matching Policy
    const matchResult = matchStudentName(buyerName, ocrResult.text);
    verificationRecord.extracted_text_preview = ocrResult.text.slice(0, 200); // Partial preview for audit
    verificationRecord.match_score = matchResult.confidence;

    if (matchResult.isMatch) {
      // High confidence match approved automatically
      verificationRecord.status = 'approved';
      verificationRecord.verified_at = new Date().toISOString();
      await saveStudentVerification(verificationRecord);

      const { token, expiresAt } = generateVerificationToken(
        verificationRecord.id,
        buyerName,
        'student_id_name_match'
      );

      await appendAuditLog({
        action: 'student_id_name_match_approved',
        entity: 'student_verification',
        entity_id: verificationRecord.id,
        details: {
          confidence: matchResult.confidence,
          institution: ocrResult.metadata?.institution,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          status: 'approved',
          verification_id: verificationRecord.id,
          verification_token: token,
          token_expires_at: expiresAt,
          confidence: matchResult.confidence,
          message: 'Student ID name check successful! Student ticket rate unlocked.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ambiguous or mismatch
    verificationRecord.status = 'retry_required';
    verificationRecord.failure_reason = matchResult.reason;
    await saveStudentVerification(verificationRecord);

    await appendAuditLog({
      action: 'student_id_name_match_failed',
      entity: 'student_verification',
      entity_id: verificationRecord.id,
      details: {
        confidence: matchResult.confidence,
        reason: matchResult.reason,
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        status: 'retry_required',
        reason: matchResult.reason,
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
