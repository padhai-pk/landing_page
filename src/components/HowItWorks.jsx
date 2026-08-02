import React from 'react';
import Reveal from './Reveal.jsx';
import FloatingIcons from './FloatingIcons.jsx';
import { useContent } from '../lib/content.jsx';
import { getIcon } from '../lib/icons.js';
import './HowItWorks.css';

const BG_ICONS = [
  { icon: 'GraduationCap', top: '6%', left: '85%', size: 56, delay: 0.3, duration: 8.5, rotate: 8 },
  { icon: 'ShieldCheck', top: '50%', left: '5%', size: 48, delay: 1, duration: 7, rotate: -10 },
  { icon: 'Video', top: '85%', left: '80%', size: 40, delay: 0.5, duration: 9, rotate: 12 },
];

export default function HowItWorks() {
  const content = useContent();
  const { eyebrow, heading, steps } = content.howItWorks;

  return (
    <section id="how-it-works" className="section howit">
      <FloatingIcons items={BG_ICONS} />
      <div className="container">
        <Reveal>
          <div className="howit__head">
            <div className="eyebrow">{eyebrow}</div>
            <h2>{heading}</h2>
          </div>
        </Reveal>

        <ol className="howit__list">
          {steps.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <Reveal key={s.title} as="li" delay={i * 90} className="howit__step">
                <span className="howit__num">
                  <span className="howit__num-icon"><Icon size={20} /></span>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
