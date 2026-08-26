// src/lib/universities.js
// University names from Hipolabs (proxied via /api/universities to avoid CORS).

const cache = new Map();
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function normalizeCountry(country) {
  return String(country || '').trim();
}

async function fetchUniversitiesForCountry(country) {
  const key = normalizeCountry(country).toLowerCase();
  if (!key) return [];

  const cached = cache.get(key);
  if (cached && (Date.now() - cached.at) < CACHE_MAX_AGE_MS) {
    return cached.list;
  }

  const params = new URLSearchParams({ country: normalizeCountry(country) });
  const res = await fetch(`/api/universities?${params.toString()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });

  if (!res.ok) {
    throw new Error('Could not load universities for the selected country.');
  }

  const data = await res.json();
  const list = Array.isArray(data) ? data : [];
  cache.set(key, { at: Date.now(), list });
  return list;
}

/** Returns sorted unique university names for a country. */
export async function fetchUniversityNames(country) {
  const universities = await fetchUniversitiesForCountry(country);
  const names = universities.map((u) => u.name).filter(Boolean);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}
