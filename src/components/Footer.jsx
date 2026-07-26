import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <div className="footer__logo">Padhai<span>.pk</span></div>
          <p className="footer__tagline">Padhna ho ya Padhana, sirf Padhai.pk pr aana.</p>
        </div>

        <nav className="footer__links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#badge-program">Teacher seats</a>
          <a href="#faq">FAQ</a>
          <a href="#waitlist">Waitlist</a>
        </nav>

        <p className="footer__copy">© {new Date().getFullYear()} Padhai.pk. Pre-launch — open to students and teachers everywhere.</p>
      </div>
    </footer>
  );
}
