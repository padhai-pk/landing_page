import React, { useEffect, useRef, useState } from 'react';
import { Instagram, X } from 'lucide-react';
import { useContent } from '../lib/content.jsx';
import './InstagramPopup.css';

const SESSION_KEY = 'padhai-insta-popup-shown';

// Shows once per browser session, the first time the Seat Program section
// (#badge-program) scrolls into view.
export default function InstagramPopup() {
  const content = useContent();
  const [visible, setVisible] = useState(false);
  const hasShownRef = useRef(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        hasShownRef.current = true;
      }
    } catch { /* sessionStorage unavailable — popup will just show every load */ }

    const target = document.getElementById('badge-program');
    if (!target || hasShownRef.current) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasShownRef.current) {
          hasShownRef.current = true;
          setVisible(true);
          try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  if (!visible) return null;

  const { instagramPopup } = content;

  return (
    <div className="insta-popup__overlay" role="dialog" aria-modal="true" aria-label="Follow us on Instagram">
      <div className="insta-popup">
        <button type="button" className="insta-popup__close" onClick={() => setVisible(false)} aria-label="Close">
          <X size={18} />
        </button>

        <h3 className="insta-popup__title">{instagramPopup.title}</h3>

        <div className="insta-popup__cards">
          <div className="insta-popup__card">
            <span className="insta-popup__icon"><Instagram size={24} /></span>
            <strong>{instagramPopup.main.handle}</strong>
            <p>{instagramPopup.main.blurb}</p>
            <a href={instagramPopup.main.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
              Follow
            </a>
          </div>

          <div className="insta-popup__card">
            <span className="insta-popup__icon"><Instagram size={24} /></span>
            <strong>{instagramPopup.bts.handle}</strong>
            <p>{instagramPopup.bts.blurb}</p>
            <a href={instagramPopup.bts.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary-outline btn-sm">
              Follow
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}