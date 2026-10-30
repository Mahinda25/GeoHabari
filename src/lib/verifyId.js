import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

function normalizeName(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isExpired(expiryText, now = new Date()) {
  const date = expiryText.replace(/\s+/g, '');
  let year;
  let month = 12;

  if (/^\d{4}$/.test(date)) {
    year = Number(date);
  } else {
    const match = date.match(/^(\d{1,2})[/-](\d{2}|\d{4})$/);
    if (!match) return null;

    month = Number(match[1]);
    year = Number(match[2]);
    if (month < 1 || month > 12) return null;
    if (year < 100) year += year >= 80 ? 1900 : 2000;
  }

  const expirationBoundary = new Date(year, month, 0, 23, 59, 59, 999);
  return expirationBoundary < now;
}

function findExpiryMatch(rawText) {
  const expiryPattern =
    /\b(?:EXP(?:IR(?:ATION|Y|ES))?|EXPIRES?|VALID(?:\s+THRU|\s+THROUGH|\s+UNTIL)?|THRU)\b\s*[:#.-]?\s*(\d{1,2}\s*[/-]\s*\d{2,4}|\d{4})\b/i;

  for (const line of rawText.split(/\r\n?|\n/)) {
    const match = line.match(expiryPattern);
    if (match) return match;
  }

  return null;
}

export function validateStudentIdOcrText(text) {
  const rawText = typeof text === 'string' ? text : '';
  const alphanumericCharacterCount = rawText.match(/[A-Z0-9]/gi)?.length ?? 0;
  if (alphanumericCharacterCount < 5) {
    return { success: false, reason: 'LOW_IMAGE_QUALITY' };
  }

  const expiryMatch = findExpiryMatch(rawText);
  if (expiryMatch) {
    const expired = isExpired(expiryMatch[1]);
    if (expired === true) {
      return { success: false, reason: 'EXPIRED_ID' };
    }
    if (expired === null) {
      return { success: false, reason: 'INVALID_EXPIRY_DATE' };
    }
  }

  return { success: true, text: rawText };
}

export async function processStudentIdOcr(image) {
  let worker = null;

  try {
    if (
      !(typeof image === 'string' && image.trim()) &&
      !Buffer.isBuffer(image)
    ) {
      return { success: false, reason: 'PROCESSING_ERROR' };
    }

    const cleanCardBuffer = await sharp(image)
      .resize({ width: 1000 })
      .greyscale()
      .threshold(120)
      .toBuffer();

    worker = await createWorker('eng');
    await worker.setParameters({ tessedit_pageseg_mode: '6' });

    const { data } = await worker.recognize(cleanCardBuffer);
    return validateStudentIdOcrText(data?.text);
  } catch (error) {
    console.error('Student ID OCR processing failed:', error);
    return { success: false, reason: 'PROCESSING_ERROR' };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error('Student ID OCR worker termination failed:', error);
      }
    }
  }
}

/**
 * Verifies an uploaded student ID image against the buyer's full name.
 * The image can be a filesystem path or a Node.js Buffer.
 */
export async function verifyExactWordStudentId(imagePath, buyerDetails) {
  const targetName = normalizeName(buyerDetails?.name);
  if (!targetName) {
    return { verified: false, reason: 'NAME_MISMATCH' };
  }

  const ocrResult = await processStudentIdOcr(imagePath);
  if (!ocrResult.success) {
    return { verified: false, reason: ocrResult.reason };
  }

  const nameMatched = ocrResult.text
    .split(/\r\n?|\n/)
    .map(normalizeName)
    .some((line) => line === targetName);

  return nameMatched
    ? { verified: true, reason: 'VERIFIED' }
    : { verified: false, reason: 'NAME_MISMATCH' };
}
