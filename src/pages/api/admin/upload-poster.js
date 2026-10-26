import crypto from 'node:crypto';
import { getAdminFromRequest } from '../../../lib/auth.js';
import { supabase } from '../../../lib/supabase.js';
import { appendAuditLog } from '../../../lib/ticketing-store.js';

const MAX_POSTER_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * Validates image buffer using magic bytes (file signature)
 */
function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: 'File is too small or corrupted.' };
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (isPng) {
    return { isValid: true, detectedType: 'image/png', extension: 'png' };
  }

  // JPEG signature: FF D8 FF
  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpg) {
    return { isValid: true, detectedType: 'image/jpeg', extension: 'jpg' };
  }

  // WebP signature: RIFF....WEBP (bytes 0-3: 52 49 46 46, bytes 8-11: 57 45 42 50)
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isRiff && isWebp) {
    return { isValid: true, detectedType: 'image/webp', extension: 'webp' };
  }

  return {
    isValid: false,
    error: 'Invalid file signature. Only PNG, JPG/JPEG, and WebP image formats are accepted.',
  };
}

export async function POST({ request, cookies }) {
  // 1. Authenticate admin user
  const auth = await getAdminFromRequest(request, cookies);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin session required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Request must be multipart/form-data with an image file.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') || formData.get('poster');

    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
      return new Response(
        JSON.stringify({ error: 'No image file was uploaded.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate declared MIME type
    const declaredType = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(declaredType)) {
      return new Response(
        JSON.stringify({
          error: 'Unsupported image format. Please upload a PNG, JPG/JPEG, or WebP image.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Validate file size
    if (buffer.length > MAX_POSTER_SIZE_BYTES) {
      return new Response(
        JSON.stringify({
          error: `Image exceeds the 5MB maximum limit (uploaded ${Math.round(buffer.length / 1024 / 1024 * 10) / 10}MB). Please select a smaller image.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validate binary magic bytes to prevent spoofing
    const magicCheck = validateImageMagicBytes(buffer);
    if (!magicCheck.isValid) {
      return new Response(
        JSON.stringify({ error: magicCheck.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileExt = magicCheck.extension;
    const finalMime = magicCheck.detectedType;
    const safeFilename = `poster-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

    if (!supabase) {
      throw new Error('Poster storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    const bucketName = process.env.SUPABASE_POSTER_BUCKET || 'event-posters';
    const storagePath = `posters/${safeFilename}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, { contentType: finalMime, upsert: false });
    if (uploadError || !uploadData) {
      throw new Error(`Poster upload failed: ${uploadError?.message || 'No upload result returned.'}`);
    }
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    const persistentUrl = publicUrlData?.publicUrl;
    if (!persistentUrl) throw new Error('Poster uploaded but Supabase did not return a public URL.');

    // 7. Audit log
    await appendAuditLog({
      action: 'admin_poster_uploaded',
      entity: 'event_poster',
      entity_id: safeFilename,
      details: {
        admin_email: auth.user.email,
        file_name: file.name || safeFilename,
        size_bytes: buffer.length,
        mime_type: finalMime,
        storage_provider: 'supabase-storage',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: persistentUrl,
        filename: safeFilename,
        size: buffer.length,
        mimeType: finalMime,
        storageProvider: 'supabase-storage',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred during image upload.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
