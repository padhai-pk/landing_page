import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, X } from 'lucide-react';
import useDropdownPlacement from '../hooks/useDropdownPlacement.js';
import './Autocomplete.css';

// Single-select searchable combobox — used for Country / City. Options is a
// plain string array. Type while focused to filter; Enter selects the first match.
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
  const inputRef = useRef(null);
  const listId = useId();
  const { style, placement } = useDropdownPlacement(open, inputRef, 260);

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
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  function select(option) {
    onChange(option);
    setOpen(false);
    setQuery('');
  }

  function clear(e) {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleFocus() {
    if (disabled) return;
    setQuery(value || '');
    setOpen(true);
  }

  function handleChange(e) {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) select(filtered[0]);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (
        rootRef.current?.contains(document.activeElement) ||
        document.activeElement?.closest?.('.autocomplete__panel')
      ) {
        return;
      }
      setOpen(false);
    }, 0);
  }

  const displayValue = open ? query : (value || '');

  return (
    <div className={`autocomplete ${disabled ? 'is-disabled' : ''}`} ref={rootRef}>
      <div className={`autocomplete__trigger ${open ? 'is-open' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className="autocomplete__input"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? (disabledMessage || placeholder) : placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <Loader2 size={15} className="autocomplete__spin" />}
        {value && !loading && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            className="autocomplete__clear"
            onMouseDown={clear}
            aria-label="Clear"
          >
            <X size={13} />
          </span>
        )}
        <ChevronDown size={15} className={`autocomplete__chevron ${open ? 'is-open' : ''}`} />
      </div>

      {open && !disabled && style && createPortal(
        <div className={`autocomplete__panel autocomplete__panel--${placement}`} style={style}>
          <ul id={listId} className="autocomplete__list" role="listbox">
            {loading && filtered.length === 0 && (
              <li className="autocomplete__empty">Loading…</li>
            )}
            {!loading && filtered.length === 0 && (
              <li className="autocomplete__empty">{emptyMessage}</li>
            )}
            {filtered.map((o, index) => (
              <li key={o}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === o}
                  className={`autocomplete__option ${value === o ? 'is-selected' : ''} ${index === 0 && query.trim() ? 'is-highlighted' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
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
