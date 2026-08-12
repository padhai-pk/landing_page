import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useContent } from '../lib/content.jsx';
import './InstagramPopup.css';

const VIEW_THRESHOLD = 0.12;
const SCROLL_DELTA = 4;

function isBadgeSectionInView(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, viewportHeight);
  const visibleHeight = visibleBottom - visibleTop;
  if (visibleHeight <= 0) return false;
  return visibleHeight / Math.max(rect.height, 1) >= VIEW_THRESHOLD;
}

function InstaProfileAvatar({ profileImage, handle }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = profileImage?.startsWith('http') ? profileImage : `/${profileImage}`;

  if (profileImage && !failed) {
    return (
      <img
        className="insta-popup__avatar"
        src={imageSrc}
        alt={`${handle} profile`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const initial = (handle || '?').replace('@', '').charAt(0).toUpperCase();

  return (
    <span className="insta-popup__avatar insta-popup__avatar--fallback" aria-hidden="true">
      {initial}
    </span>
  );
}

// Shows when the Seat Program section (#badge-program) scrolls into view
// while the user is scrolling downward — not when scrolling back up.
export default function InstagramPopup() {
  const content = useContent();
  const [visible, setVisible] = useState(false);
  const dismissedWhileInViewRef = useRef(false);
  const scrollingDownRef = useRef(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let io = null;
    lastScrollYRef.current = window.scrollY;

    function updateScrollDirection() {
      const y = window.scrollY;
      if (y > lastScrollYRef.current + SCROLL_DELTA) {
        scrollingDownRef.current = true;
      } else if (y < lastScrollYRef.current - SCROLL_DELTA) {
        scrollingDownRef.current = false;
      }
      lastScrollYRef.current = y;
    }

    function onScroll() {
      updateScrollDirection();
      const target = document.getElementById('badge-program');
      if (!scrollingDownRef.current && target && isBadgeSectionInView(target)) {
        setVisible(false);
      }
    }

    function attachObserver() {
      const target = document.getElementById('badge-program');
      if (!target) return;

      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (scrollingDownRef.current && !dismissedWhileInViewRef.current) {
              setVisible(true);
            }
          } else {
            dismissedWhileInViewRef.current = false;
          }
        },
        {
          threshold: VIEW_THRESHOLD,
          // Account for the fixed navbar and trigger slightly before the section fully enters view.
          rootMargin: '-72px 0px -10% 0px',
        }
      );
      io.observe(target);
    }

    attachObserver();
    window.addEventListener('scroll', onScroll, { passive: true });

    function onNavigateToBadgeSection() {
      if (window.location.hash !== '#badge-program') return;
      scrollingDownRef.current = true;
      window.setTimeout(() => {
        const target = document.getElementById('badge-program');
        if (isBadgeSectionInView(target) && !dismissedWhileInViewRef.current) {
          setVisible(true);
        }
      }, 350);
    }

    window.addEventListener('hashchange', onNavigateToBadgeSection);
    if (window.location.hash === '#badge-program') onNavigateToBadgeSection();

    return () => {
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onNavigateToBadgeSection);
    };
  }, []);

  function handleClose() {
    dismissedWhileInViewRef.current = true;
    setVisible(false);
  }

  if (!visible) return null;

  const { instagramPopup } = content;

  return (
    <div className="insta-popup__overlay" role="dialog" aria-modal="true" aria-label="Follow us on Instagram">
      <div className="insta-popup">
        <button type="button" className="insta-popup__close" onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>

        <h3 className="insta-popup__title">{instagramPopup.title}</h3>

        <div className="insta-popup__cards">
          <div className="insta-popup__card">
            <InstaProfileAvatar profileImage={instagramPopup.main.profileImage} handle={instagramPopup.main.handle} />
            <strong>{instagramPopup.main.handle}</strong>
            <p>{instagramPopup.main.blurb}</p>
            <a href={instagramPopup.main.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
              Follow
            </a>
          </div>

          <div className="insta-popup__card">
            <InstaProfileAvatar profileImage={instagramPopup.bts.profileImage} handle={instagramPopup.bts.handle} />
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
