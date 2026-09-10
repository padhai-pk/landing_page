// src/lib/validators.js

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_RE.test((email || '').trim());
}

// Pakistani CNIC: 13 digits, conventionally shown as 5-7-1 (e.g. 42101-1234567-1).
export function isValidCnic(cnic) {
  const digits = (cnic || '').replace(/\D/g, '');
  return digits.length === 13;
}

// Auto-inserts dashes as the user types: 4210112345671 -> 42101-1234567-1
export function formatCnicInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  const part1 = digits.slice(0, 5);
  const part2 = digits.slice(5, 12);
  const part3 = digits.slice(12, 13);
  return [part1, part2, part3].filter(Boolean).join('-');
}

export function isNonEmpty(value) {
  return Boolean((value || '').trim());
}

export function isValidExperience(value) {
  if (value === null || value === undefined || value === '') return true; // optional
  return /^\d+$/.test(String(value).trim());
}

// Ambassador referral code format: XXX-X-XXX (e.g. ABC-1-XYZ)
const AMBASSADOR_REFERRAL_CODE_RE = /^[A-Za-z0-9]{3}-[A-Za-z0-9]-[A-Za-z0-9]{3}$/;

export function isValidAmbassadorReferralCode(value) {
  const code = (value || '').trim();
  if (!code) return true; // optional on waitlist signup
  return AMBASSADOR_REFERRAL_CODE_RE.test(code);
}

export function normalizeAmbassadorReferralCode(value) {
  return (value || '').trim().toUpperCase();
}