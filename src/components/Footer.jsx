import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal.jsx';
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

        <p className="footer__copy">© {new Date().getFullYear()} {content.footer.copyright}</p>
      </Reveal>
    </footer>
  );
}
