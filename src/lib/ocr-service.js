/**
 * OCR and Document Name Matching Service
 * Supports Google Cloud Vision API, AWS Textract, and local deterministic matching.
 */

// Title and boilerplate words to strip from token analysis
const NOISE_WORDS = new Set([
  'student', 'id', 'card', 'identity', 'university', 'college', 'campus',
  'admission', 'registration', 'reg', 'no', 'adm', 'republic', 'kenya',
  'valid', 'until', 'expiry', 'expires', 'date', 'issue', 'issued',
  'faculty', 'department', 'school', 'course', 'degree', 'diploma', 'national'
]);

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Calculates similarity ratio between two tokens [0, 1]
 */
function tokenSimilarity(tokA, tokB) {
  if (tokA === tokB) return 1.0;
  const maxLen = Math.max(tokA.length, tokB.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(tokA, tokB);
  return Math.max(0, 1 - dist / maxLen);
}

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
 * Compares buyer's entered name with extracted text from Student ID
 * Automated name-matching policy based on token overlap and edit distance
 */
export function matchStudentName(buyerName, extractedText) {
  const normBuyer = normalizeText(buyerName);
  const normExtracted = normalizeText(extractedText);

  if (!normBuyer || !normExtracted) {
    return {
      isMatch: false,
      confidence: 0,
      reason: 'Missing buyer name or extracted text.',
    };
  }

  // Tokenize buyer name (filter out single characters and noise)
  const buyerTokens = normBuyer
    .split(' ')
    .filter((tok) => tok.length > 1 && !NOISE_WORDS.has(tok));

  if (buyerTokens.length === 0) {
    return {
      isMatch: false,
      confidence: 0,
      reason: 'Buyer name does not contain identifiable name tokens.',
    };
  }

  // Tokenize extracted document text
  const docTokens = normExtracted
    .split(' ')
    .filter((tok) => tok.length > 1 && !NOISE_WORDS.has(tok));

  // Find best match in doc for each buyer token
  const tokenScores = [];

  for (const bToken of buyerTokens) {
    let bestScore = 0;
    for (const dToken of docTokens) {
      // Direct substring match or high similarity
      if (dToken === bToken) {
        bestScore = 1.0;
        break;
      }
      const sim = tokenSimilarity(bToken, dToken);
      if (sim > bestScore) {
        bestScore = sim;
      }
    }
    tokenScores.push(bestScore);
  }

  // Calculate composite confidence
  const avgScore = tokenScores.reduce((acc, s) => acc + s, 0) / tokenScores.length;
  const minScore = Math.min(...tokenScores);

  // Policy:
  // - High confidence: Average >= 0.85 and every token >= 0.70 (handles minor OCR typos)
  // - Ambiguous: Average >= 0.50 but doesn't meet high confidence
  // - Mismatch: Average < 0.50
  if (avgScore >= 0.85 && minScore >= 0.70) {
    return {
      isMatch: true,
      confidence: Math.round(avgScore * 100) / 100,
      reason: 'Name clearly matches extracted text from ID.',
    };
  }

  if (avgScore >= 0.50) {
    return {
      isMatch: false,
      isAmbiguous: true,
      confidence: Math.round(avgScore * 100) / 100,
      reason: 'Name match is ambiguous. Please upload a clearer document or use university email.',
    };
  }

  return {
    isMatch: false,
    confidence: Math.round(avgScore * 100) / 100,
    reason: 'Name on document does not match the buyer name.',
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
      return {
        success: true,
        provider: 'google',
        text: extractedText,
        metadata: extractDocumentMetadata(extractedText),
      };
    } catch (err) {
      console.error('[OCR] Google Vision request error:', err.message);
    }
  }

  // 2. AWS Textract
  if (provider === 'aws' && process.env.AWS_ACCESS_KEY_ID) {
    // Adapter hook for AWS Textract SDK when configured
    return {
      success: false,
      provider: 'aws',
      reason: 'aws_textract_configured_via_sdk_required',
    };
  }

  // 3. Fallback: If no external OCR provider is active
  // As per instructions: "If no OCR provider is configured, do not fake a successful result.
  // Provide a clear setup requirement and safe fallback to verified university email or Professional ticket."
  return {
    success: false,
    provider: provider || 'none',
    reason: 'ocr_provider_unconfigured',
    message: 'Automated document OCR is not configured. Please verify your student eligibility using your .ac.ke university email or select a Professional ticket.',
  };
}
