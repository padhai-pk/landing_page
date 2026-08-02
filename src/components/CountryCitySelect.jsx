import React, { useEffect, useState } from 'react';
import Autocomplete from './Autocomplete.jsx';
import { fetchCountries, fetchCitiesForCountry } from '../lib/geo.js';

// Two cascading dropdowns: pick a country first, then its cities load.
// Falls back to plain text inputs if the free geo API is unreachable, so a
// network hiccup never blocks someone from finishing the form.
export default function CountryCitySelect({ country, city, onCountryChange, onCityChange }) {
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesFailed, setCountriesFailed] = useState(false);

  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesFailed, setCitiesFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCountriesLoading(true);
    fetchCountries()
      .then((list) => { if (!cancelled) { setCountries(list); setCountriesFailed(false); } })
      .catch(() => { if (!cancelled) setCountriesFailed(true); })
      .finally(() => { if (!cancelled) setCountriesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!country) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setCitiesLoading(true);
    setCitiesFailed(false);
    fetchCitiesForCountry(country)
      .then((list) => { if (!cancelled) setCities(list); })
      .catch(() => { if (!cancelled) { setCitiesFailed(true); setCities([]); } })
      .finally(() => { if (!cancelled) setCitiesLoading(false); });
    return () => { cancelled = true; };
  }, [country]);

  function handleCountryChange(next) {
    onCountryChange(next);
    if (next !== country) onCityChange(''); // reset city when country changes
  }

  return (
    <>
      <label>
        Country
        {countriesFailed ? (
          <input value={country} onChange={(e) => handleCountryChange(e.target.value)} placeholder="Pakistan" />
        ) : (
          <Autocomplete
            value={country}
            onChange={handleCountryChange}
            options={countries}
            loading={countriesLoading}
            placeholder="Select your country"
            emptyMessage="No countries match"
          />
        )}
      </label>

      <label>
        City
        {citiesFailed ? (
          <input value={city} onChange={(e) => onCityChange(e.target.value)} placeholder="Karachi" disabled={!country} />
        ) : (
          <Autocomplete
            value={city}
            onChange={onCityChange}
            options={cities}
            loading={citiesLoading}
            disabled={!country}
            disabledMessage="Select a country first"
            placeholder="Select your city"
            emptyMessage="No cities found — type your country name differently or try again"
          />
        )}
      </label>
    </>
  );
}
