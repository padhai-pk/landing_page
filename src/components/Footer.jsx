import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal.jsx';
import { Facebook, Instagram } from 'lucide-react';
import { useContent } from '../lib/content.jsx';
import './Footer.css';

export default function Footer() {
  const content = useContent();

  return (
    <footer className="footer">
      <Reveal className="container footer__inner">
        <div>
          <Link to="/" className="footer__logo">
            <img className="footer__logo-img" src={content.logo.srcDark} alt={content.logo.alt} />
          </Link>
          <p className="footer__tagline">{content.footer.tagline}</p>
        </div>

        <nav className="footer__links">
          {content.nav.links.map((l) => (
            <a key={l.href} href={`/${l.href}`}>{l.label}</a>
          ))}
        </nav>

        <div className="footer__social">
          <a href={content.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Padhai.pk on Facebook">
            <Facebook size={18} />
          </a>
          <a href={content.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Padhai.pk on Instagram">
            <Instagram size={18} />
          </a>
        </div>

        <p className="footer__copy">© {new Date().getFullYear()} {content.footer.copyright}</p>
      </Reveal>
    </footer>
  );
}
