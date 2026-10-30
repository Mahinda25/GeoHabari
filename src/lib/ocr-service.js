/**
 * OCR and Document Name Matching Service
 * Supports Google Cloud Vision API with local Tesseract OCR fallback.
 */
import { processStudentIdOcr, validateStudentIdOcrText } from './verifyId.js';

/**
 * Normalizes text for clean tokenization
 */
export function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compares all buyer-name tokens against distinct OCR tokens, allowing small OCR errors.
 */
export function matchStudentName(buyerName, extractedText) {
  const normalizeTokens = (value) => String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const buyerWords = normalizeTokens(buyerName).split(' ').filter(Boolean);
  const ocrWords = normalizeTokens(extractedText).split(' ').filter(Boolean);

  if (buyerWords.length === 0 || ocrWords.length === 0) {
    return {
      isMatch: false,
      confidence: 0,
      reason: 'Missing buyer name or extracted text.',
    };
  }

  const distance = (left, right) => {
    let previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
      const currentRow = [leftIndex];
      for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
        currentRow[rightIndex] = Math.min(
          previousRow[rightIndex] + 1,
          currentRow[rightIndex - 1] + 1,
          previousRow[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
        );
      }
      previousRow = currentRow;
    }

    return previousRow[right.length];
  };
  const maxTypos = (word) => word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0;
  const candidates = buyerWords.map((buyerWord) => ocrWords
    .map((ocrWord, index) => ({ index, edits: distance(buyerWord, ocrWord) }))
    .filter(({ edits }) => edits <= maxTypos(buyerWord))
    .sort((a, b) => a.edits - b.edits)
    .map(({ index }) => index));

  // Find a one-to-one assignment so a single OCR token cannot satisfy multiple names.
  const matchedBuyerByOcr = new Array(ocrWords.length).fill(-1);
  const assign = (buyerIndex, visited) => {
    for (const ocrIndex of candidates[buyerIndex]) {
      if (visited[ocrIndex]) continue;
      visited[ocrIndex] = true;
      if (
        matchedBuyerByOcr[ocrIndex] === -1 ||
        assign(matchedBuyerByOcr[ocrIndex], visited)
      ) {
        matchedBuyerByOcr[ocrIndex] = buyerIndex;
        return true;
      }
    }
    return false;
  };

  let matchedWordsCount = 0;
  for (let buyerIndex = 0; buyerIndex < buyerWords.length; buyerIndex++) {
    if (assign(buyerIndex, new Array(ocrWords.length).fill(false))) {
      matchedWordsCount++;
    }
  }

  const confidence = Math.round((matchedWordsCount / buyerWords.length) * 100);
  return confidence === 100
    ? { isMatch: true, confidence }
    : {
      isMatch: false,
      confidence,
      reason: `Name match failed. Only verified ${matchedWordsCount} of ${buyerWords.length} name components on your ID card.`,
    };
}

/**
 * Extracts visible institution and potential expiry date from OCR text
 */
export function extractDocumentMetadata(text) {
  const norm = String(text || '');
  let institution = null;
  let expiryDate = null;

  // Check for common universities
  const knownInstitutions = [
    'University of Nairobi', 'Kenyatta University', 'JKUAT',
    'Strathmore University', 'Moi University', 'Egerton University',
    'Technical University of Kenya', 'Mount Kenya University', 'USIU',
    'Daystar University', 'Dedan Kimathi University',
  ];

  for (const inst of knownInstitutions) {
    if (new RegExp(inst, 'i').test(norm)) {
      institution = inst;
      break;
    }
  }

  // Check for common date formats (DD/MM/YYYY or YYYY-MM-DD or Month YYYY)
  const dateMatch = norm.match(/\b(202[4-9]|203[0-5])[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/) ||
                    norm.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](202[4-9]|203[0-5])\b/);

  if (dateMatch) {
    expiryDate = dateMatch[0];
  }

  return { institution, expiryDate };
}

/**
 * Main OCR execution adapter
 */
export async function processDocumentOcr(buffer, mimeType) {
  const provider = (process.env.OCR_PROVIDER || '').toLowerCase();

  // 1. Google Cloud Vision API
  if (provider === 'google' && process.env.GOOGLE_VISION_API_KEY) {
    try {
      const apiKey = process.env.GOOGLE_VISION_API_KEY;
      const url = `https://vision.googleapis.com/v1/images:annotate${apiKey ? `?key=${apiKey}` : ''}`;

      const requestBody = {
        requests: [
          {
            image: { content: buffer.toString('base64') },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok || data.responses?.[0]?.error) {
        throw new Error(data.responses?.[0]?.error?.message || `Google Vision returned ${res.status}.`);
      }
      const extractedText = data.responses?.[0]?.fullTextAnnotation?.text || '';
      const validatedText = validateStudentIdOcrText(extractedText);
      if (validatedText.success) {
        return {
          success: true,
          provider: 'google',
          text: validatedText.text,
          metadata: extractDocumentMetadata(validatedText.text),
        };
      }
      if (validatedText.reason !== 'LOW_IMAGE_QUALITY') {
        return {
          ...validatedText,
          provider: 'google',
          message: validatedText.reason === 'EXPIRED_ID'
            ? 'This Student ID has expired.'
            : 'The expiration date on this Student ID could not be validated.',
        };
      }
    } catch (err) {
      console.error('[OCR] Google Vision request error:', err.message);
    }
  }

  const localResult = await processStudentIdOcr(buffer);
  if (localResult.success) {
    return {
      success: true,
      provider: 'local',
      text: localResult.text,
      metadata: extractDocumentMetadata(localResult.text),
    };
  }

  return {
    success: false,
    provider: provider || 'local',
    reason: localResult.reason,
    message: localResult.reason === 'LOW_IMAGE_QUALITY'
      ? 'The uploaded image text is unreadable. Please upload a clearer Student ID image.'
      : localResult.reason === 'EXPIRED_ID'
        ? 'This Student ID has expired.'
        : localResult.reason === 'INVALID_EXPIRY_DATE'
          ? 'The expiration date on this Student ID could not be validated.'
          : 'Automated document OCR failed. Please verify using your .ac.ke university email or select a Professional ticket.',
  };
}
