import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import { Facebook, Instagram } from 'lucide-react';
import { useContent } from '../lib/content.jsx';
import './Navbar.css';
import { useTheme } from '../lib/theme.jsx';

export default function Navbar() {
  const content = useContent();
  const { theme } = useTheme();
const logoSrc = theme === 'dark' ? content.logo.srcDark : content.logo.srcLight;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = content.nav.links;

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
      <Link to="/" className="navbar__logo">
  <img className="navbar__logo-img" src={logoSrc} alt={content.logo.alt} />
</Link>

        <nav className="navbar__links">
          {links.map((l) => (
            <a key={l.href} href={`/${l.href}`}>{l.label}</a>
          ))}
        </nav>

        <div className="navbar__actions">
          <a href={content.social.facebook} target="_blank" rel="noopener noreferrer" className="icon-btn navbar__social" aria-label="Padhai.pk on Facebook">
            <Facebook size={16} />
          </a>
          <a href={content.social.instagram} target="_blank" rel="noopener noreferrer" className="icon-btn navbar__social" aria-label="Padhai.pk on Instagram">
            <Instagram size={16} />
          </a>
          <ThemeToggle />
          <a href="/#waitlist" className="btn btn-primary btn-sm navbar__cta">
            {content.nav.cta}
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
            <a key={l.href} href={`/${l.href}`} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <a href="/#waitlist" className="btn btn-primary btn-md" onClick={() => setOpen(false)}>
            {content.nav.cta}
          </a>
        </div>
      )}
    </header>
  );
}
