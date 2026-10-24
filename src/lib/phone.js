const EAST_AFRICAN_PREFIXES = ['254', '256', '255', '250', '257', '211', '251', '252'];

const NATIONAL_NUMBER_LENGTHS = {
  '254': [9],
  '256': [9],
  '255': [9],
  '250': [9],
  '257': [8],
  '211': [9],
  '251': [9],
  '252': [7, 8, 9],
};

/**
 * @param {string | number | null | undefined} value
 * @param {string | number} [countryCode]
 */
export function normalizeEastAfricanPhone(value, countryCode = '254') {
  const input = String(value ?? '').trim().replace(/[^\d+]/g, '');
  if (!input) return '';

  const digits = input.replace(/\D/g, '');
  const knownPrefix = EAST_AFRICAN_PREFIXES.find((prefix) => digits.startsWith(prefix));
  if (input.startsWith('+') || knownPrefix) {
    return `+${digits}`;
  }

  const selectedPrefix = String(countryCode).replace(/\D/g, '');
  if (!NATIONAL_NUMBER_LENGTHS[selectedPrefix]) return '';

  const nationalNumber = digits.startsWith('0') ? digits.slice(1) : digits;
  const internationalNumber = nationalNumber.startsWith(selectedPrefix)
    ? nationalNumber
    : `${selectedPrefix}${nationalNumber}`;

  return `+${internationalNumber}`;
}

/**
 * @param {string | number | null | undefined} value
 * @param {string | number} [countryCode]
 */
export function validateEastAfricanPhone(value, countryCode = '254') {
  const normalized = normalizeEastAfricanPhone(value, countryCode);
  const match = normalized.match(/^\+(254|256|255|250|257|211|251|252)(\d+)$/);
  if (!match) return false;

  const [, prefix, nationalNumber] = match;
  return NATIONAL_NUMBER_LENGTHS[prefix].includes(nationalNumber.length);
}

/**
 * Safaricom Kenya mobile prefixes supported for Paystack M-Pesa checkout.
 * @param {string | number | null | undefined} value
 */
export function isSafaricomKenyaPhone(value) {
  const normalized = normalizeEastAfricanPhone(value);
  return /^\+254(?:7[01249]\d{7}|1[01]\d{7})$/.test(normalized);
}
