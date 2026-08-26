import React, { useEffect, useState } from 'react';
import Autocomplete from './Autocomplete.jsx';
import { fetchUniversityNames } from '../lib/universities.js';

// Optional university picker — loads names for the selected country.
export default function UniversitySelect({
  country,
  value,
  onChange,
  label = 'University / college (optional)',
  placeholder = 'Search your university',
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!country) {
      setOptions([]);
      setFailed(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    fetchUniversityNames(country)
      .then((names) => {
        if (!cancelled) setOptions(names);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [country]);

  return (
    <label className="university-select">
      {label}
      {failed ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your university name"
          disabled={!country}
        />
      ) : (
        <Autocomplete
          value={value}
          onChange={onChange}
          options={options}
          loading={loading}
          disabled={!country}
          disabledMessage="Select a country first"
          placeholder={country ? placeholder : 'Select a country first'}
          emptyMessage="No universities found — type to search"
        />
      )}
    </label>
  );
}
