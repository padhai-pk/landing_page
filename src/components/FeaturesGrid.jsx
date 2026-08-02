import React from 'react';
import Reveal from './Reveal.jsx';
import FloatingIcons from './FloatingIcons.jsx';
import { useContent } from '../lib/content.jsx';
import { getIcon } from '../lib/icons.js';
import './FeaturesGrid.css';

const BG_ICONS = [
  { icon: 'Wallet', top: '5%', left: '4%', size: 52, delay: 0.2, duration: 7.5, rotate: -8 },
  { icon: 'Landmark', top: '35%', left: '90%', size: 56, delay: 1, duration: 9, rotate: 10 },
  { icon: 'Star', top: '78%', left: '6%', size: 40, delay: 0.7, duration: 6.5, rotate: 14 },
  { icon: 'Lock', top: '88%', left: '88%', size: 38, delay: 1.3, duration: 8, rotate: -12 },
];

export default function FeaturesGrid() {
  const content = useContent();
  const { eyebrow, heading, subtext, items } = content.features;

  return (
    <section id="features" className="section features">
      <FloatingIcons items={BG_ICONS} />
      <div className="container">
        <Reveal>
          <div className="features__head">
            <div className="eyebrow">{eyebrow}</div>
            <h2>{heading}</h2>
            <p>{subtext}</p>
          </div>
        </Reveal>

        <div className="features__grid">
          {items.map((f, i) => {
            const Icon = getIcon(f.icon);
            return (
              <Reveal key={f.title} delay={(i % 4) * 80} className="features__reveal">
                <div className="features__card">
                  <span className="features__icon" aria-hidden="true"><Icon size={20} /></span>
                  <h4>{f.title}</h4>
                  <p>{f.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
