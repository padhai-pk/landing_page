import React from 'react';
import { getIcon } from '../lib/icons.js';
import './FloatingIcons.css';

// Purely decorative, low-opacity outlined icons scattered around a section
// — never inside the content column, never interactive.
// `items`: { icon: 'BookOpen', top: '18%', left: '12%', size: 56, delay: 0, duration: 7, rotate: -8 }
export default function FloatingIcons({ items }) {
  return (
    <div className="floating-icons" aria-hidden="true">
      {items.map((it, i) => {
        const Icon = getIcon(it.icon);
        return (
          <span
            key={i}
            className="floating-icons__item"
            style={{
              top: it.top,
              left: it.left,
              '--size': `${it.size ?? 56}px`,
              '--delay': `${it.delay ?? 0}s`,
              '--duration': `${it.duration ?? 7}s`,
              '--rotate': `${it.rotate ?? 0}deg`,
            }}
          >
            <Icon size={it.size ?? 56} strokeWidth={1.25} />
          </span>
        );
      })}
    </div>
  );
}