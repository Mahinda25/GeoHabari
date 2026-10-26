import crypto from 'node:crypto';
import { supabase } from './supabase.js';

const PRIVATE_DOCUMENT_BUCKET = process.env.SUPABASE_PRIVATE_DOCUMENT_BUCKET || 'student-documents';

function normalizeDocumentKey(storageKey) {
  if (typeof storageKey !== 'string' || storageKey.includes('..') || storageKey.includes('\\')) {
    throw new Error('Invalid private document storage key.');
  }
  const normalized = storageKey.startsWith('student-ids/') ? storageKey : `student-ids/${storageKey}`;
  if (!/^student-ids\/[A-Za-z0-9-]+\.[A-Za-z0-9]+$/.test(normalized)) {
    throw new Error('Invalid private document storage key.');
  }
  return normalized;
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
  if (!supabase) {
    throw new Error('Private document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const fileId = crypto.randomUUID();
  const cleanExt = extension.replace(/^\./, '').toLowerCase();
  const safeFilename = `${fileId}.${cleanExt}`;
  const storageKey = `student-ids/${safeFilename}`;
  const { error } = await supabase.storage.from(PRIVATE_DOCUMENT_BUCKET).upload(storageKey, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw new Error(`Unable to store private document: ${error.message}`);
  const hash = calculateFileHash(buffer);

  return {
    storageKey,
    absolutePath: null,
    hash,
    size: buffer.length,
    mimeType,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Reads a private file from storage
 */
export async function readPrivateFile(storageKey) {
  if (!supabase) {
    throw new Error('Private document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const normalizedKey = normalizeDocumentKey(storageKey);
  const { data, error } = await supabase.storage.from(PRIVATE_DOCUMENT_BUCKET).download(normalizedKey);
  if (error) {
    if (error.message.toLowerCase().includes('not found')) return null;
    throw new Error(`Unable to read private document: ${error.message}`);
  }
  if (!data) throw new Error('Private document storage returned no file data.');
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Securely deletes a private file
 */
export async function deletePrivateFile(storageKey) {
  if (!storageKey) return false;
  if (!supabase) {
    throw new Error('Private document storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const normalizedKey = normalizeDocumentKey(storageKey);
  const { error } = await supabase.storage.from(PRIVATE_DOCUMENT_BUCKET).remove([normalizedKey]);
  if (error) throw new Error(`Unable to delete private document: ${error.message}`);
  return true;
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
