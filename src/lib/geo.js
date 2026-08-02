// src/lib/geo.js
// Free, no-API-key country/city data via countriesnow.space. Countries are
// fetched once and cached; cities are fetched per-country and cached per
// country so re-selecting the same country doesn't refetch.

const COUNTRIES_URL = 'https://countriesnow.space/api/v0.1/countries/positions';
const CITIES_URL = 'https://countriesnow.space/api/v0.1/countries/cities';

let countriesPromise = null;
const citiesCache = new Map();

export function fetchCountries() {
  if (!countriesPromise) {
    countriesPromise = fetch(COUNTRIES_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load countries');
        return res.json();
      })
      .then((json) => {
        const names = (json?.data || [])
          .map((c) => c.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        return names;
      })
      .catch((err) => {
        countriesPromise = null; // allow retry on next call
        throw err;
      });
  }
  return countriesPromise;
}

export function fetchCitiesForCountry(country) {
  if (!country) return Promise.resolve([]);
  if (citiesCache.has(country)) return citiesCache.get(country);

  const promise = fetch(CITIES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country }),
  })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load cities');
      return res.json();
    })
    .then((json) => {
      const cities = (json?.data || []).slice().sort((a, b) => a.localeCompare(b));
      return cities;
    })
    .catch((err) => {
      citiesCache.delete(country); // allow retry
      throw err;
    });

  citiesCache.set(country, promise);
  return promise;
}
