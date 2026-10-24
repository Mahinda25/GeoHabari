import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Private directory outside of static public routes
const DEFAULT_UPLOAD_DIR = path.resolve(__dirname, '../data/private-uploads');
const uploadDir = process.env.PRIVATE_UPLOAD_DIR || DEFAULT_UPLOAD_DIR;

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Calculates SHA-256 hash of a buffer
 */
export function calculateFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Saves a file to private storage with a random UUID
 */
export async function savePrivateFile(buffer, extension, mimeType) {
  ensureUploadDir();

  const fileId = crypto.randomUUID();
  const cleanExt = extension.replace(/^\./, '').toLowerCase();
  const safeFilename = `${fileId}.${cleanExt}`;
  const absolutePath = path.join(uploadDir, safeFilename);

  fs.writeFileSync(absolutePath, buffer, { mode: 0o600 });
  const hash = calculateFileHash(buffer);

  return {
    storageKey: safeFilename,
    absolutePath,
    hash,
    size: buffer.length,
    mimeType,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Reads a private file from storage
 */
export function readPrivateFile(storageKey) {
  // Prevent directory traversal attacks
  const safeKey = path.basename(storageKey);
  const absolutePath = path.join(uploadDir, safeKey);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath);
}

/**
 * Securely deletes a private file
 */
export function deletePrivateFile(storageKey) {
  if (!storageKey) return false;
  const safeKey = path.basename(storageKey);
  const absolutePath = path.join(uploadDir, safeKey);

  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Generates an HMAC-signed short-lived token for authorized document viewing
 */
export function generateSignedDocumentToken(storageKey, expiresInSeconds = 300) {
  const secret = process.env.DOCUMENT_SIGNING_SECRET;
  if (!secret) {
    throw new Error('Private document signing is not configured. Set DOCUMENT_SIGNING_SECRET.');
  }
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${storageKey}:${expiresAt}`)
    .digest('hex');

  return {
    token: `${expiresAt}.${signature}`,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

/**
 * Verifies a short-lived document token
 */
export function verifySignedDocumentToken(storageKey, tokenStr) {
  if (!tokenStr || !tokenStr.includes('.')) return false;
  const [expiresStr, signature] = tokenStr.split('.');
  const expiresAt = Number(expiresStr);

  if (Date.now() > expiresAt) {
    return false; // Expired
  }

  const secret = process.env.DOCUMENT_SIGNING_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${storageKey}:${expiresAt}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
