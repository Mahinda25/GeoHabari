import crypto from 'node:crypto';

export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5 MB
export const CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_VERIFICATION_ATTEMPTS = 5;
export const MAX_RESEND_ATTEMPTS = 3;
export const RETENTION_DAYS = Number(process.env.STUDENT_ID_RETENTION_DAYS || 30);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);

/**
 * Validates Kenyan university email domain ending in .ac.ke
 * Strict label-boundary check, case-insensitive
 */
export function isValidUniversityEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
  const match = trimmed.match(emailRegex);
  if (!match) return false;

  const domain = match[1];
  const domainLabels = domain.split('.');

  // Must have at least <institution>.ac.ke (3 labels)
  if (domainLabels.length < 3) return false;

  const tld = domainLabels[domainLabels.length - 1];
  const sld = domainLabels[domainLabels.length - 2];

  return tld === 'ke' && sld === 'ac';
}

/**
 * Generates a cryptographically secure 6-digit numeric verification code
 */
export function generateVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Calculates SHA-256 hash of a verification code or token
 */
export function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

/**
 * Verifies code against stored hash using timing-safe comparison
 */
export function verifyCodeHash(inputCode, storedHash) {
  if (!inputCode || !storedHash) return false;
  const inputHash = hashVerificationCode(inputCode);
  try {
    return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Detects MIME type from file signature / magic bytes
 */
export function detectFileSignature(buffer) {
  if (!buffer || buffer.length < 4) return null;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }

  // PNG: 0x89 0x50 0x4E 0x47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50   // WEBP
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Validates uploaded student document file
 */
export function validateUploadedDocument(buffer, declaredMime, filename) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { isValid: false, error: 'No file data received.' };
  }

  // 1. File size check
  if (buffer.length > MAX_DOCUMENT_SIZE) {
    return { isValid: false, error: 'File size exceeds 5 MB limit.' };
  }

  if (buffer.length < 32) {
    return { isValid: false, error: 'File is empty or corrupted.' };
  }

  // 2. Extension check
  const ext = filename ? (filename.slice(filename.lastIndexOf('.')).toLowerCase()) : '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { isValid: false, error: 'Unsupported file extension. Allowed: PDF, PNG, JPG, JPEG, WEBP.' };
  }

  // 3. Declared MIME check
  const normalizedMime = String(declaredMime || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    return { isValid: false, error: 'Unsupported MIME type.' };
  }

  // 4. Magic bytes detection
  const detectedType = detectFileSignature(buffer);
  if (!detectedType) {
    return { isValid: false, error: 'File content does not match allowed format signature.' };
  }

  // Ensure declared MIME aligns with detected type
  const isJpeg = (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') && detectedType === 'image/jpeg';
  if (detectedType !== normalizedMime && !isJpeg) {
    return { isValid: false, error: 'File header does not match declared file type.' };
  }

  return {
    isValid: true,
    detectedType,
    extension: ext || (detectedType === 'application/pdf' ? '.pdf' : `.${detectedType.split('/')[1]}`),
  };
}

/**
 * Generates an HMAC-signed student verification token
 */
export function generateVerificationToken(verificationId, buyerName, method) {
  const secret = process.env.VERIFICATION_TOKEN_SECRET || process.env.ADMIN_API_KEY || 'geohabari-token-secret-fallback';
  const expiresAt = Date.now() + VERIFICATION_TOKEN_EXPIRY_MS;
  const payload = `${verificationId}:${buyerName.trim().toLowerCase()}:${method}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return {
    token: `${verificationId}.${expiresAt}.${signature}`,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

/**
 * Verifies the validity and authenticity of a verification token
 */
export function verifyVerificationToken(tokenStr, buyerName) {
  if (!tokenStr || typeof tokenStr !== 'string' || !tokenStr.includes('.')) {
    return { isValid: false, error: 'Malformed verification token.' };
  }

  const parts = tokenStr.split('.');
  if (parts.length !== 3) {
    return { isValid: false, error: 'Invalid token structure.' };
  }

  const [verificationId, expiresStr, signature] = parts;
  const expiresAt = Number(expiresStr);

  if (Date.now() > expiresAt) {
    return { isValid: false, error: 'Verification token has expired.' };
  }

  const secret = process.env.VERIFICATION_TOKEN_SECRET || process.env.ADMIN_API_KEY || 'geohabari-token-secret-fallback';
  
  // Try both methods if unknown
  const methods = ['university_email', 'student_id_name_match'];
  let matched = false;

  for (const method of methods) {
    const payload = `${verificationId}:${buyerName.trim().toLowerCase()}:${method}:${expiresAt}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    try {
      if (crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
        matched = true;
        break;
      }
    } catch {
      // continue
    }
  }

  if (!matched) {
    return { isValid: false, error: 'Token signature mismatch or buyer name mismatch.' };
  }

  return {
    isValid: true,
    verificationId,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}
