import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import useDropdownPlacement from '../hooks/useDropdownPlacement.js';
import { fetchPhoneCodes, FALLBACK_PHONE_CODES } from '../lib/phoneCodes.js';
import { validateNationalNumber } from '../lib/phoneValidation.js';
import './PhoneInput.css';

function formatNationalNumber(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

// Combines a searchable country-code (with flag) dropdown and a national
// number field into one control. Calls onChange(combinedString, isValid)
// on every change — e.g. onChange("+92 3211234567", true).
export default function PhoneInput({ defaultCca2 = 'PK', onChange, required = true }) {
  const [codes, setCodes] = useState(FALLBACK_PHONE_CODES);
  const [selected, setSelected] = useState(
    FALLBACK_PHONE_CODES.find((c) => c.cca2 === defaultCca2) || FALLBACK_PHONE_CODES[0]
  );
  const [national, setNational] = useState('');
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const { style, placement } = useDropdownPlacement(open, triggerRef, 320);

  useEffect(() => {
    let cancelled = false;
    fetchPhoneCodes()
      .then((list) => {
        if (cancelled || !list.length) return;
        setCodes(list);
        const match = list.find((c) => c.cca2 === defaultCca2);
        if (match) setSelected(match);
      })
      .catch(() => {
        // Keep FALLBACK_PHONE_CODES — the field stays usable.
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        rootRef.current && !rootRef.current.contains(e.target) &&
        !e.target.closest('.phone-input__panel')
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const validation = useMemo(
    () => validateNationalNumber(national, selected?.cca2),
    [national, selected]
  );

  useEffect(() => {
    const full = national ? `${selected.dialCode} ${national}`.trim() : '';
    onChange?.(full, national ? validation.valid : !required);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [national, selected, validation.valid]);

  const filteredCodes = useMemo(() => {
    if (!query) return codes;
    const q = query.toLowerCase();
    return codes.filter((c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q));
  }, [codes, query]);

  function selectCode(c) {
    setSelected(c);
    setOpen(false);
    setQuery('');
  }

  const showError = touched && national && !validation.valid;

  return (
    <div className="phone-input" ref={rootRef}>
      <div className={`phone-input__field ${showError ? 'has-error' : ''}`} ref={triggerRef}>
        <button
          type="button"
          className="phone-input__code-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {selected?.flagEmoji ? (
            <span className="phone-input__flag-emoji">{selected.flagEmoji}</span>
          ) : (
            <img className="phone-input__flag-img" src={selected?.flag} alt="" />
          )}
          <span className="phone-input__dial-code">{selected?.dialCode}</span>
          <ChevronDown size={14} className={`phone-input__chevron ${open ? 'is-open' : ''}`} />
        </button>

        <input
          type="tel"
          className="phone-input__number"
          value={national}
          onChange={(e) => setNational(formatNationalNumber(e.target.value))}
          onBlur={() => setTouched(true)}
          placeholder="3XX-XXXXXXX"
          required={required}
        />
      </div>

      {showError && <p className="phone-input__error">{validation.reason}</p>}

      {open && style && createPortal(
        <div className={`phone-input__panel phone-input__panel--${placement}`} style={style}>
          <div className="phone-input__search">
            <Search size={15} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code…"
            />
          </div>
          <ul className="phone-input__list" role="listbox">
            {filteredCodes.length === 0 && <li className="phone-input__empty">No matches</li>}
            {filteredCodes.map((c) => (
              <li key={`${c.cca2}-${c.dialCode}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected?.cca2 === c.cca2}
                  className={`phone-input__option ${selected?.cca2 === c.cca2 ? 'is-selected' : ''}`}
                  onClick={() => selectCode(c)}
                >
                  {c.flagEmoji ? (
                    <span className="phone-input__flag-emoji">{c.flagEmoji}</span>
                  ) : (
                    <img className="phone-input__flag-img" src={c.flag} alt="" />
                  )}
                  <span className="phone-input__option-name">{c.name}</span>
                  <span className="phone-input__option-code">{c.dialCode}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}