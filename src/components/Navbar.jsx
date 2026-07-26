import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#how-it-works', label: 'How it works' },
    { href: '#features', label: 'Features' },
    { href: '#badge-program', label: 'Teacher Seats' },
    { href: '#faq', label: 'FAQ' },
    { href: '#waitlist', label: 'Waitlist' },
  ];

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <a href="#top" className="navbar__logo">
          Padhai<span>.pk</span>
        </a>

        <nav className="navbar__links">
          {links.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>

        <div className="navbar__actions">
          <ThemeToggle />
          <a href="#waitlist" className="btn btn-primary btn-sm navbar__cta">
            Join waitlist
          </a>
          <button
            className="navbar__burger icon-btn"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="navbar__mobile">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <a href="#waitlist" className="btn btn-primary btn-md" onClick={() => setOpen(false)}>
            Join waitlist
          </a>
        </div>
      )}
    </header>
  );
}
