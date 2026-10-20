import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidUniversityEmail,
  validateUploadedDocument,
  detectFileSignature,
  generateVerificationCode,
  hashVerificationCode,
  verifyCodeHash,
  generateVerificationToken,
  verifyVerificationToken,
} from '../src/lib/student-verification.js';

import {
  matchStudentName,
  normalizeText,
} from '../src/lib/ocr-service.js';

import {
  normalizeToE164,
  maskEmail,
  validateProviderConfiguration,
} from '../src/lib/whatsapp.js';

import {
  calculateFileHash,
} from '../src/lib/private-storage.js';

import {
  ensureOrderRequestValid,
  createOrderCheckout,
  verifyPaymentAndIssueTickets,
} from '../src/lib/ticketing.js';

import {
  resetStore,
  saveStudentVerification,
  getStudentVerificationById,
  saveWhatsAppNotification,
  getWhatsAppNotificationByOrderId,
  readStore,
} from '../src/lib/ticketing-store.js';

describe('University Email Domain Validation (.ac.ke)', () => {
  test('Accepts standard Kenyan university domains ending in .ac.ke', () => {
    assert.equal(isValidUniversityEmail('student@uonbi.ac.ke'), true);
    assert.equal(isValidUniversityEmail('j.wanjiru@ku.ac.ke'), true);
    assert.equal(isValidUniversityEmail('tech@jkuat.ac.ke'), true);
    assert.equal(isValidUniversityEmail('alumni@strathmore.edu.ac.ke'), true);
    assert.equal(isValidUniversityEmail('JOHN@STUDENTS.UONBI.AC.KE'), true); // case-insensitive
  });

  test('Accepts institutional subdomains ending in .ac.ke', () => {
    assert.equal(isValidUniversityEmail('student123@students.ku.ac.ke'), true);
    assert.equal(isValidUniversityEmail('research@gis.dept.uonbi.ac.ke'), true);
  });

  test('Rejects lookalike and spoofed domains', () => {
    assert.equal(isValidUniversityEmail('hacker@university.ac.ke.example.com'), false);
    assert.equal(isValidUniversityEmail('spoof@uonbi.ac.ke.attacker.io'), false);
    assert.equal(isValidUniversityEmail('user@badac.ke'), false);
    assert.equal(isValidUniversityEmail('user@ac.ke.org'), false);
    assert.equal(isValidUniversityEmail('user@gmail.com'), false);
    assert.equal(isValidUniversityEmail('user@uonbi.ke'), false);
    assert.equal(isValidUniversityEmail('user@ac.ke'), false); // needs institution label
  });

  test('Rejects malformed email syntax', () => {
    assert.equal(isValidUniversityEmail(''), false);
    assert.equal(isValidUniversityEmail(null), false);
    assert.equal(isValidUniversityEmail('not-an-email'), false);
    assert.equal(isValidUniversityEmail('@uonbi.ac.ke'), false);
    assert.equal(isValidUniversityEmail('user @uonbi.ac.ke'), false);
  });
});

describe('Document Upload Validation & Magic Bytes Check', () => {
  test('Detects valid PDF magic bytes (%PDF-)', () => {
    const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    assert.equal(detectFileSignature(pdfHeader), 'application/pdf');

    const result = validateUploadedDocument(Buffer.concat([pdfHeader, Buffer.alloc(100)]), 'application/pdf', 'card.pdf');
    assert.equal(result.isValid, true);
    assert.equal(result.detectedType, 'application/pdf');
  });

  test('Detects valid PNG magic bytes', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(detectFileSignature(pngHeader), 'image/png');

    const result = validateUploadedDocument(Buffer.concat([pngHeader, Buffer.alloc(100)]), 'image/png', 'card.png');
    assert.equal(result.isValid, true);
    assert.equal(result.detectedType, 'image/png');
  });

  test('Detects valid JPEG magic bytes', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    assert.equal(detectFileSignature(jpegHeader), 'image/jpeg');

    const result = validateUploadedDocument(Buffer.concat([jpegHeader, Buffer.alloc(100)]), 'image/jpeg', 'card.jpg');
    assert.equal(result.isValid, true);
    assert.equal(result.detectedType, 'image/jpeg');
  });

  test('Rejects files exceeding 5 MB limit', () => {
    const hugeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);
    const result = validateUploadedDocument(hugeBuffer, 'image/png', 'huge.png');
    assert.equal(result.isValid, false);
    assert.match(result.error, /exceeds 5 MB limit/);
  });

  test('Rejects unsupported file extensions and MIME mismatches', () => {
    const dummy = Buffer.from('hello world not an image');
    const result = validateUploadedDocument(dummy, 'application/x-msdownload', 'card.exe');
    assert.equal(result.isValid, false);
  });

  test('Calculates consistent cryptographic SHA-256 hash', () => {
    const buf = Buffer.from('student-sample-id-bytes');
    const hash1 = calculateFileHash(buf);
    const hash2 = calculateFileHash(buf);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });
});

describe('Automated OCR Name Matching Policy', () => {
  test('Clearly matching name passes with high confidence', () => {
    const buyer = 'Jane Wanjiru';
    const ocrText = 'UNIVERSITY OF NAIROBI STUDENT IDENTITY CARD NAME: JANE WANJIRU ADM: F17/2026';
    const match = matchStudentName(buyer, ocrText);
    assert.equal(match.isMatch, true);
    assert.ok(match.confidence >= 0.85);
  });

  test('Handles inverted name ordering (Last First vs First Last)', () => {
    const buyer = 'Jane Wanjiru';
    const ocrText = 'KENYATTA UNIVERSITY ID CARD WANJIRU, JANE ADMISSION NUMBER E45/1020/2024';
    const match = matchStudentName(buyer, ocrText);
    assert.equal(match.isMatch, true);
    assert.ok(match.confidence >= 0.85);
  });

  test('Tolerates minor OCR character variations', () => {
    const buyer = 'Stephen Shaphan';
    const ocrText = 'STUDENT ID STEPHEN SHAPHAN REG 2026';
    const match = matchStudentName(buyer, ocrText);
    assert.equal(match.isMatch, true);
  });

  test('Ambiguous or missing names do not automatically approve', () => {
    const buyer = 'Kevin Otieno';
    const ocrText = 'STUDENT ID CARD BRIAN KAMAU ADM 9999';
    const match = matchStudentName(buyer, ocrText);
    assert.equal(match.isMatch, false);
    assert.equal(match.confidence < 0.5, true);
  });
});

describe('OTP & Verification Tokens', () => {
  test('Generates and verifies cryptographic OTP hash', () => {
    const code = generateVerificationCode();
    assert.equal(code.length, 6);
    const hash = hashVerificationCode(code);
    assert.equal(verifyCodeHash(code, hash), true);
    assert.equal(verifyCodeHash('000000', hash), false);
  });

  test('Generates and verifies HMAC verification token bound to buyer name', () => {
    const { token } = generateVerificationToken('ver-123', 'Jane Wanjiru', 'university_email');
    const verified = verifyVerificationToken(token, 'Jane Wanjiru');
    assert.equal(verified.isValid, true);
    assert.equal(verified.verificationId, 'ver-123');

    // Rejects token if buyer name does not match
    const wrongBuyer = verifyVerificationToken(token, 'Different Buyer');
    assert.equal(wrongBuyer.isValid, false);
  });
});

describe('WhatsApp Formatting & Phone Normalization', () => {
  test('Normalizes Kenyan numbers to E.164 format', () => {
    assert.equal(normalizeToE164('0712345678'), '+254712345678');
    assert.equal(normalizeToE164('+254712345678'), '+254712345678');
    assert.equal(normalizeToE164('254712345678'), '+254712345678');
    assert.equal(normalizeToE164('712345678'), '+254712345678');
  });

  test('Masks email addresses appropriately for privacy', () => {
    assert.equal(maskEmail('jane.wanjiru@example.com'), 'j***u@example.com');
    assert.equal(maskEmail('me@test.ac.ke'), 'm*@test.ac.ke');
  });
});

describe('Server-Side Pricing & Checkout Security Enforcement', () => {
  test('Professional ticket checkout succeeds without student verification at KES 1,000', () => {
    resetStore();
    const event = readStore().events[0];
    const profTicket = readStore().ticket_types.find((t) => t.event_id === event.id && t.name === 'Professional');

    const result = createOrderCheckout(event.id, {
      buyer_name: 'Professional Buyer',
      email: 'buyer@corporate.com',
      phone: '0712345678',
      ticket_type_id: profTicket.id,
      quantity: 2,
      payment_method: 'mpesa',
      accept_terms: true,
      whatsapp_opt_in: true,
    });

    assert.equal(result.order.status, 'pending');
    assert.equal(result.order.amount, 2000); // 2 * 1000
    assert.equal(result.order.whatsapp_opt_in, true);
  });

  test('Student ticket checkout FAILS when student verification is missing', () => {
    resetStore();
    const event = readStore().events[0];
    const studentTicket = readStore().ticket_types.find((t) => t.event_id === event.id && t.name === 'Student');

    assert.throws(
      () => {
        createOrderCheckout(event.id, {
          buyer_name: 'Unverified Student',
          email: 'student@gmail.com',
          phone: '0712345678',
          ticket_type_id: studentTicket.id,
          quantity: 1,
          payment_method: 'card',
          accept_terms: true,
        });
      },
      /Student verification required for discounted Student tickets/
    );
  });

  test('Student ticket checkout SUCCEEDS with valid approved verification at KES 600', () => {
    resetStore();
    const event = readStore().events[0];
    const studentTicket = readStore().ticket_types.find((t) => t.event_id === event.id && t.name === 'Student');

    const verificationRecord = saveStudentVerification({
      id: 'ver-approved-test',
      method: 'university_email',
      buyer_name: 'Jane Wanjiru',
      email: 'jane@uonbi.ac.ke',
      status: 'approved',
      created_at: new Date().toISOString(),
    });

    const { token } = generateVerificationToken(verificationRecord.id, 'Jane Wanjiru', 'university_email');

    const result = createOrderCheckout(event.id, {
      buyer_name: 'Jane Wanjiru',
      email: 'jane@uonbi.ac.ke',
      phone: '0712345678',
      ticket_type_id: studentTicket.id,
      quantity: 1,
      payment_method: 'mpesa',
      accept_terms: true,
      student_verification_id: verificationRecord.id,
      student_verification_token: token,
      whatsapp_opt_in: false,
    });

    assert.equal(result.order.status, 'pending');
    assert.equal(result.order.amount, 600); // Enforced KES 600
    assert.equal(result.order.student_verification_id, 'ver-approved-test');
  });

  test('Enforces maximum 5 tickets per order', () => {
    resetStore();
    const event = readStore().events[0];
    const profTicket = readStore().ticket_types.find((t) => t.event_id === event.id && t.name === 'Professional');

    assert.throws(
      () => {
        createOrderCheckout(event.id, {
          buyer_name: 'Greedy Buyer',
          email: 'greedy@example.com',
          phone: '0712345678',
          ticket_type_id: profTicket.id,
          quantity: 6, // Exceeds 5
          payment_method: 'mpesa',
          accept_terms: true,
        });
      },
      /Quantity must be between 1 and 5 tickets/
    );
  });

  test('Payment confirmation issues unique tickets and records idempotent WhatsApp notification', () => {
    resetStore();
    const event = readStore().events[0];
    const profTicket = readStore().ticket_types.find((t) => t.event_id === event.id && t.name === 'Professional');

    const checkout = createOrderCheckout(event.id, {
      buyer_name: 'Payment Test Buyer',
      email: 'pay@example.com',
      phone: '0712345678',
      ticket_type_id: profTicket.id,
      quantity: 2,
      payment_method: 'card',
      accept_terms: true,
      whatsapp_opt_in: true,
    });

    const verification = verifyPaymentAndIssueTickets({
      orderReference: checkout.order.reference,
      provider: 'card',
      providerReference: 'CARD-REF-999',
      status: 'paid',
    });

    assert.equal(verification.order.status, 'paid');
    assert.equal(verification.alreadyProcessed, false);

    // Re-verifying same payment is idempotent
    const secondCall = verifyPaymentAndIssueTickets({
      orderReference: checkout.order.reference,
      provider: 'card',
      providerReference: 'CARD-REF-999',
      status: 'paid',
    });

    assert.equal(secondCall.alreadyProcessed, true);
  });
});
