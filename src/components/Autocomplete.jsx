import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, X } from 'lucide-react';
import useDropdownPlacement from '../hooks/useDropdownPlacement.js';
import './Autocomplete.css';

// Single-select searchable dropdown — used for Country / City. Options is a
// plain string array. Opens downward by default, flips upward automatically
// if there isn't room below (fixes panels overlapping the bottom of screen).
export default function Autocomplete({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  loading = false,
  emptyMessage = 'No matches',
  disabledMessage = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const { style, placement } = useDropdownPlacement(open, triggerRef, 280);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        rootRef.current && !rootRef.current.contains(e.target) &&
        !e.target.closest('.autocomplete__panel')
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  }, [options, query]);

  function select(option) {
    onChange(option);
    setOpen(false);
  }

  function clear(e) {
    e.stopPropagation();
    onChange('');
  }

  return (
    <div className={`autocomplete ${disabled ? 'is-disabled' : ''}`} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="autocomplete__trigger"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        disabled={disabled}
        title={disabled ? disabledMessage : undefined}
      >
        <span className={value ? 'autocomplete__value' : 'autocomplete__placeholder'}>
          {value || (disabled ? disabledMessage || placeholder : placeholder)}
        </span>
        {loading && <Loader2 size={15} className="autocomplete__spin" />}
        {value && !loading && (
          <span role="button" tabIndex={-1} className="autocomplete__clear" onClick={clear} aria-label="Clear">
            <X size={13} />
          </span>
        )}
        <ChevronDown size={15} className={`autocomplete__chevron ${open ? 'is-open' : ''}`} />
      </button>

      {open && !disabled && style && createPortal(
        <div className={`autocomplete__panel autocomplete__panel--${placement}`} style={style}>
          <input
            autoFocus
            type="text"
            className="autocomplete__search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search…"
          />
          <ul className="autocomplete__list" role="listbox">
            {filtered.length === 0 && <li className="autocomplete__empty">{emptyMessage}</li>}
            {filtered.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === o}
                  className={`autocomplete__option ${value === o ? 'is-selected' : ''}`}
                  onClick={() => select(o)}
                >
                  {o}
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
