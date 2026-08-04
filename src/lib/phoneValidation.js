// src/lib/phoneValidation.js
// Basic, per-country phone number validation — approximate national-number
// length ranges for common countries, with a general fallback for everyone
// else. This is intentionally simple (length + digits-only), not a full
// numbering-plan library.

const LENGTH_RULES = {
    PK: { min: 10, max: 10, example: '3XXXXXXXXX' },
    IN: { min: 10, max: 10, example: '9XXXXXXXXX' },
    US: { min: 10, max: 10, example: '2015550123' },
    CA: { min: 10, max: 10, example: '2015550123' },
    GB: { min: 10, max: 10, example: '7911123456' },
    AE: { min: 9, max: 9, example: '501234567' },
    SA: { min: 9, max: 9, example: '512345678' },
    BD: { min: 10, max: 10, example: '1812345678' },
    AU: { min: 9, max: 9, example: '412345678' },
    DE: { min: 10, max: 11, example: '15123456789' },
    FR: { min: 9, max: 9, example: '612345678' },
  };
  
  const DEFAULT_RULE = { min: 6, max: 12 };
  
  export function validateNationalNumber(nationalNumber, cca2) {
    const digitsOnly = (nationalNumber || '').replace(/\D/g, '');
  
    if (!digitsOnly) {
      return { valid: false, reason: 'Enter a phone number.' };
    }
  
    const rule = LENGTH_RULES[cca2] || DEFAULT_RULE;
  
    if (digitsOnly.length < rule.min || digitsOnly.length > rule.max) {
      const expected = rule.min === rule.max ? `${rule.min} digits` : `${rule.min}\u2013${rule.max} digits`;
      return {
        valid: false,
        reason: `Enter a valid number (${expected}${rule.example ? `, e.g. ${rule.example}` : ''}).`,
      };
    }
  
    return { valid: true, digitsOnly };
  }