// src/lib/phoneCodes.js
// Free country calling codes via countriesnow.space (same provider as geo.js).
// Fetched once and cached for the session.

const URL = 'https://countriesnow.space/api/v0.1/countries/codes';

let promise = null;

function flagUrl(cca2) {
  return `https://flagcdn.com/w40/${String(cca2 || '').toLowerCase()}.png`;
}

function normalizeDialCode(dialCode) {
  return String(dialCode || '').replace(/\s+/g, '');
}

// Small built-in fallback (emoji flags, no network needed) so the phone
// field still works if the API is unreachable.
export const FALLBACK_PHONE_CODES = [
  { name: 'Pakistan', cca2: 'PK', dialCode: '+92', flagEmoji: '🇵🇰' },
  { name: 'India', cca2: 'IN', dialCode: '+91', flagEmoji: '🇮🇳' },
  { name: 'United States', cca2: 'US', dialCode: '+1', flagEmoji: '🇺🇸' },
  { name: 'United Kingdom', cca2: 'GB', dialCode: '+44', flagEmoji: '🇬🇧' },
  { name: 'United Arab Emirates', cca2: 'AE', dialCode: '+971', flagEmoji: '🇦🇪' },
  { name: 'Saudi Arabia', cca2: 'SA', dialCode: '+966', flagEmoji: '🇸🇦' },
  { name: 'Bangladesh', cca2: 'BD', dialCode: '+880', flagEmoji: '🇧🇩' },
  { name: 'Canada', cca2: 'CA', dialCode: '+1', flagEmoji: '🇨🇦' },
  { name: 'Australia', cca2: 'AU', dialCode: '+61', flagEmoji: '🇦🇺' },
];

export function fetchPhoneCodes() {
  if (!promise) {
    promise = fetch(URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load country codes');
        return res.json();
      })
      .then((json) => {
        const list = (json?.data || [])
          .map((item) => ({
            name: item.name,
            cca2: item.code,
            dialCode: normalizeDialCode(item.dial_code),
            flag: flagUrl(item.code),
          }))
          .filter((item) => item.name && item.cca2 && item.dialCode)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!list.length) throw new Error('No country codes returned');
        return list;
      })
      .catch((err) => {
        promise = null; // allow retry on next call
        throw err;
      });
  }
  return promise;
}
