import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Check, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal.jsx';
import FloatingIcons from './FloatingIcons.jsx';
import { useContent } from '../lib/content.jsx';
import { BADGE_SEATS_PER_SUBJECT } from '../lib/subjects.js';
import './SeatProgram.css';

const BG_ICONS = [
  { icon: 'Award', top: '4%', left: '82%', size: 58, delay: 0.4, duration: 8, rotate: 6 },
  { icon: 'ShieldCheck', top: '55%', left: '4%', size: 44, delay: 1.1, duration: 7, rotate: -10 },
  { icon: 'BadgeCheck', top: '82%', left: '90%', size: 38, delay: 0.6, duration: 9, rotate: 12 },
];

const TOP_N = 10;
const SEARCH_RESULTS_CAP = 12;

function sortByScarcestSeats(a, b) {
  const maxA = a.badgeSeatsMax || BADGE_SEATS_PER_SUBJECT;
  const maxB = b.badgeSeatsMax || BADGE_SEATS_PER_SUBJECT;
  const remainingA = maxA - (a.badgeSeatsFilled || 0);
  const remainingB = maxB - (b.badgeSeatsFilled || 0);
  if (remainingA !== remainingB) return remainingA - remainingB;
  return a.name.localeCompare(b.name);
}

export default function SeatProgram({ subjects }) {
  const content = useContent();
  const { eyebrow, heading, body, ctaLabel } = content.badgeProgram;
  const [query, setQuery] = useState('');
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollStrip = useCallback((direction) => {
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  }, []);

  // Default view: only the top 10 subjects that still have an open seat —
  // keeps this section light regardless of how many subjects exist.
  const topOpenSubjects = useMemo(() => {
    return subjects
      .filter((s) => (s.badgeSeatsFilled || 0) < (s.badgeSeatsMax || BADGE_SEATS_PER_SUBJECT))
      .sort(sortByScarcestSeats)
      .slice(0, TOP_N);
  }, [subjects]);

  // Search view: filters across ALL subjects (already in memory — no extra
  // fetch), capped so a broad match still renders quickly.
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return subjects
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort(sortByScarcestSeats)
      .slice(0, SEARCH_RESULTS_CAP);
  }, [subjects, query]);

  const isSearching = query.trim().length > 0;
  const visibleSubjects = isSearching ? searchResults : topOpenSubjects;

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return undefined;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateScrollButtons)
      : null;
    observer?.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
      observer?.disconnect();
    };
  }, [visibleSubjects, updateScrollButtons]);

  return (
    <section id="badge-program" className="section seatprog">
      <FloatingIcons items={BG_ICONS} />
      <div className="container">
        <Reveal>
          <div className="seatprog__head">
            <div className="eyebrow">{eyebrow}</div>
            <h2>{heading.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}</h2>
            <p>{body}</p>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="seatprog__search">
            <Search size={17} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a subject…"
            />
            {query && (
              <button type="button" className="seatprog__search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </div>
        </Reveal>

        {visibleSubjects && visibleSubjects.length === 0 ? (
          <p className="seatprog__empty">
            {isSearching
              ? `No subjects match "${query}".`
              : "All badge seats are currently claimed — join the waitlist and we'll notify you when a new round opens."}
          </p>
        ) : (
          <Reveal delay={100}>
            <div className="seatprog__carousel">
              <button
                type="button"
                className="seatprog__arrow seatprog__arrow--left"
                onClick={() => scrollStrip(-1)}
                disabled={!canScrollLeft}
                aria-label="Scroll subjects left"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="seatprog__scroll" ref={scrollRef} role="list">
                {visibleSubjects.map((s) => {
                  const filled = s.badgeSeatsFilled || 0;
                  const max = s.badgeSeatsMax || BADGE_SEATS_PER_SUBJECT;
                  return (
                    <div key={s.id} className="slip" role="listitem">
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
                            {filled >= max ? 'Seats claimed' : `${max - filled} seat${max - filled > 1 ? 's' : ''} open`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="seatprog__arrow seatprog__arrow--right"
                onClick={() => scrollStrip(1)}
                disabled={!canScrollRight}
                aria-label="Scroll subjects right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </Reveal>
        )}

        <div className="seatprog__cta">
          <Link to="/badge-application" className="btn btn-primary btn-lg">{ctaLabel}</Link>
        </div>
      </div>
    </section>
  );
}