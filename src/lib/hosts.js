export const AMBASSADOR_SITE_URL = 'https://ambassador.padhai.pk';

export function isAmbassadorHost() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host === 'ambassador.padhai.pk' || host.startsWith('ambassador.');
}
