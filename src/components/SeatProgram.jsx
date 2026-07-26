import React, { useMemo, useState } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import Reveal from './Reveal.jsx';
import './SeatProgram.css';
import { BADGE_SEATS_PER_SUBJECT, CATEGORIES } from '../lib/subjects.js';

const INITIAL_COUNT = 12;

export default function SeatProgram({ subjects }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    return subjects.filter((s) => {
      const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [subjects, query, activeCategory]);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);

  return (
    <section id="badge-program" className="section seatprog">
      <div className="container">
        <Reveal>
          <div className="seatprog__head">
            <div className="eyebrow">For teachers</div>
            <h2>2 free Verified Badge seats per subject.<br />Worth Rs. 3,000 each.</h2>
            <p>
              We're seeding teacher supply before launch across {subjects.length}+ subjects. The first two
              teachers to claim a subject get full verification — CNIC check, qualification review, and a
              short interview — completely free, plus a featured profile for 3 months. Once both seats on a
              subject are taken, it's closed — exactly like a roll-number slip with two names on it.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="seatprog__controls">
            <div className="seatprog__search">
              <Search size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowAll(true); }}
                placeholder={`Search ${subjects.length}+ subjects…`}
              />
            </div>
            <div className="seatprog__categories">
              {['All', ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`seatprog__cat ${activeCategory === c ? 'is-active' : ''}`}
                  onClick={() => { setActiveCategory(c); }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="seatprog__grid">
          {visible.map((s, i) => {
            const filled = s.badgeSeatsFilled || 0;
            const max = s.badgeSeatsMax || BADGE_SEATS_PER_SUBJECT;
            const isFull = filled >= max;
            return (
              <Reveal key={s.id} delay={(i % INITIAL_COUNT) * 40}>
                <div className={`slip ${isFull ? 'slip--full' : ''}`}>
                  <div className="slip__perf" aria-hidden="true">
                    {Array.from({ length: 8 }).map((_, j) => <span key={j} />)}
                  </div>
                  <div className="slip__body">
                    <span className="slip__category">{s.category}</span>
                    <h4 className="slip__subject">{s.name}</h4>

                    <div className="slip__seats">
                      {Array.from({ length: max }).map((_, j) => (
                        <span key={j} className={`slip__seat ${j < filled ? 'slip__seat--taken' : ''}`}>
                          {j < filled && <Check size={12} strokeWidth={3} />}
                        </span>
                      ))}
                      <span className="slip__seat-label">
                        {isFull ? 'Seats claimed' : `${max - filled} seat${max - filled > 1 ? 's' : ''} open`}
                      </span>
                    </div>
                  </div>
                  {isFull && <span className="slip__stamp">FULL</span>}
                </div>
              </Reveal>
            );
          })}
          {filtered.length === 0 && (
            <p className="seatprog__empty">No subjects match "{query}" — try a different search or category.</p>
          )}
        </div>

        {!showAll && filtered.length > INITIAL_COUNT && (
          <div className="seatprog__more">
            <button type="button" className="btn btn-outline btn-md" onClick={() => setShowAll(true)}>
              Show all {filtered.length} subjects <ChevronDown size={16} />
            </button>
          </div>
        )}

        <div className="seatprog__cta">
          <a href="#waitlist" className="btn btn-primary btn-lg">Claim a free badge seat</a>
        </div>
      </div>
    </section>
  );
}
