import React, { useEffect, useState } from 'react';
import Autocomplete from './Autocomplete.jsx';
import { fetchCountries, fetchCitiesForCountry } from '../lib/geo.js';
import './CountryCitySelect.css';

// Two cascading dropdowns: pick a country first, then its cities load.
// Falls back to plain text inputs if the free geo API is unreachable, so a
// network hiccup never blocks someone from finishing the form.
// Pass fixedCountry (e.g. "Pakistan") to lock the country field.
export default function CountryCitySelect({
  country,
  city,
  onCountryChange,
  onCityChange,
  fixedCountry,
}) {
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(!fixedCountry);
  const [countriesFailed, setCountriesFailed] = useState(false);

  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesFailed, setCitiesFailed] = useState(false);

  useEffect(() => {
    if (fixedCountry && country !== fixedCountry) {
      onCountryChange(fixedCountry);
    }
  }, [fixedCountry, country, onCountryChange]);

  useEffect(() => {
    if (fixedCountry) return undefined;
    let cancelled = false;
    setCountriesLoading(true);
    fetchCountries()
      .then((list) => { if (!cancelled) { setCountries(list); setCountriesFailed(false); } })
      .catch(() => { if (!cancelled) setCountriesFailed(true); })
      .finally(() => { if (!cancelled) setCountriesLoading(false); });
    return () => { cancelled = true; };
  }, [fixedCountry]);

  useEffect(() => {
    const activeCountry = fixedCountry || country;
    if (!activeCountry) {
      setCities([]);
      return undefined;
    }
    let cancelled = false;
    setCitiesLoading(true);
    setCitiesFailed(false);
    fetchCitiesForCountry(activeCountry)
      .then((list) => { if (!cancelled) setCities(list); })
      .catch(() => { if (!cancelled) { setCitiesFailed(true); setCities([]); } })
      .finally(() => { if (!cancelled) setCitiesLoading(false); });
    return () => { cancelled = true; };
  }, [country, fixedCountry]);

  function handleCountryChange(next) {
    if (fixedCountry) return;
    onCountryChange(next);
    if (next !== country) onCityChange('');
  }

  const activeCountry = fixedCountry || country;

  return (
    <>
      <label>
        Country
        {fixedCountry ? (
          <input
            className="country-city-select__locked"
            value={fixedCountry}
            readOnly
            aria-readonly="true"
          />
        ) : countriesFailed ? (
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
          <input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Karachi"
            disabled={!activeCountry}
          />
        ) : (
          <Autocomplete
            value={city}
            onChange={onCityChange}
            options={cities}
            loading={citiesLoading}
            disabled={!activeCountry}
            disabledMessage="Select a country first"
            placeholder="Select your city"
            emptyMessage="No cities found — type your country name differently or try again"
          />
        )}
      </label>
    </>
  );
}
