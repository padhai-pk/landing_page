import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import './SubjectPicker.css';

export default function SubjectPicker({ subjects, value, onChange, categories }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const rootRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    return subjects.filter((s) => {
      const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [subjects, query, activeCategory]);

  const selectedSubjects = subjects.filter((s) => value.includes(s.id));

  function toggle(id) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="subject-picker" ref={rootRef}>
      <div className="subject-picker__chips">
        {selectedSubjects.length === 0 && (
          <span className="subject-picker__placeholder">No subjects selected yet</span>
        )}
        {selectedSubjects.map((s) => (
          <span key={s.id} className="chip chip--active chip--removable">
            {s.name}
            <button type="button" onClick={() => toggle(s.id)} aria-label={`Remove ${s.name}`}>
              <X size={13} />
            </button>
          </span>
        ))}
      </div>

      <button
        type="button"
        className="subject-picker__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Search size={16} />
        <span>{open ? 'Search subjects…' : `Browse ${subjects.length} subjects`}</span>
        <ChevronDown size={16} className={`subject-picker__chevron ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <div className="subject-picker__panel">
          <div className="subject-picker__search">
            <Search size={16} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a subject name…"
            />
          </div>

          <div className="subject-picker__categories">
            {['All', ...categories].map((c) => (
              <button
                key={c}
                type="button"
                className={`subject-picker__cat ${activeCategory === c ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <ul className="subject-picker__list" role="listbox" aria-multiselectable="true">
            {filtered.length === 0 && <li className="subject-picker__empty">No subjects match "{query}"</li>}
            {filtered.map((s) => {
              const active = value.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`subject-picker__option ${active ? 'is-selected' : ''}`}
                    onClick={() => toggle(s.id)}
                  >
                    <span className="subject-picker__check">{active && <Check size={14} />}</span>
                    {s.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}