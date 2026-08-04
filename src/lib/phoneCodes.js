// src/lib/phoneCodes.js
// Free, no-API-key country calling codes + flags via restcountries.com.
// Fetched once and cached for the session.

const URL = 'https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2';

let promise = null;

// Small built-in fallback (emoji flags, no network needed) so the phone
// field still works if restcountries.com is unreachable.
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
        const list = json
          .filter((c) => c?.idd?.root)
          .map((c) => {
            const suffix = c.idd.suffixes && c.idd.suffixes.length === 1 ? c.idd.suffixes[0] : '';
            return {
              name: c.name?.common || c.cca2,
              cca2: c.cca2,
              dialCode: `${c.idd.root}${suffix}`,
              flag: c.flags?.svg || c.flags?.png || '',
            };
          })
          .filter((c) => c.dialCode)
          .sort((a, b) => a.name.localeCompare(b.name));
        return list;
      })
      .catch((err) => {
        promise = null; // allow retry on next call
        throw err;
      });
  }
  return promise;
}