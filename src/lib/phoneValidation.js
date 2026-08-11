// src/lib/phoneValidation.js
// Per-country phone validation — starting digit(s) + length, not just
// length. Falls back to a general digits-only length check for countries
// not listed below.

const RULES = {
  // Pakistani mobile numbers: 10 digits, must start with 3 (e.g. 3211234567)
  PK: { pattern: /^3\d{9}$/, example: '3211234567', description: 'must start with 3, 10 digits' },
  // Indian mobile numbers: 10 digits, start with 6, 7, 8, or 9
  IN: { pattern: /^[6-9]\d{9}$/, example: '9812345678', description: 'must start with 6-9, 10 digits' },
  // Bangladeshi mobile numbers: 10 digits, start with 1, second digit 3-9
  BD: { pattern: /^1[3-9]\d{8}$/, example: '1812345678', description: 'must start with 1, 10 digits' },
  // US / Canada: 10 digits, area code can't start with 0 or 1
  US: { pattern: /^[2-9]\d{9}$/, example: '2015550123', description: '10 digits' },
  CA: { pattern: /^[2-9]\d{9}$/, example: '2015550123', description: '10 digits' },
  // UK mobile: 10 digits after the leading 0 is dropped, starts with 7
  GB: { pattern: /^7\d{9}$/, example: '7911123456', description: 'must start with 7, 10 digits' },
  AE: { pattern: /^5\d{8}$/, example: '501234567', description: 'must start with 5, 9 digits' },
  SA: { pattern: /^5\d{8}$/, example: '512345678', description: 'must start with 5, 9 digits' },
  AU: { pattern: /^4\d{8}$/, example: '412345678', description: 'must start with 4, 9 digits' },
};

const DEFAULT_RULE = { pattern: /^\d{6,12}$/, description: '6-12 digits' };

export function validateNationalNumber(nationalNumber, cca2) {
  const digitsOnly = (nationalNumber || '').replace(/\D/g, '');

  if (!digitsOnly) {
    return { valid: false, reason: 'Enter a phone number.' };
  }

  const rule = RULES[cca2] || DEFAULT_RULE;

  if (!rule.pattern.test(digitsOnly)) {
    return {
      valid: false,
      reason: `Enter a valid number (${rule.description}${rule.example ? `, e.g. ${rule.example}` : ''}).`,
    };
  }

  return { valid: true, digitsOnly };
}