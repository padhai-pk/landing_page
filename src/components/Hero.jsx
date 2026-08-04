import React from 'react';
import { ArrowRight } from 'lucide-react';
import useCountUp from '../hooks/useCountUp.js';
import FloatingIcons from './FloatingIcons.jsx';
import { useContent } from '../lib/content.jsx';
import { getIcon } from '../lib/icons.js';
import './Hero.css';

const BG_ICONS = [
  { icon: 'BookOpen', top: '15%', left: '6%', size: 58, delay: 0, duration: 8, rotate: -10 },
  { icon: 'Lightbulb', top: '10%', left: '80%', size: 50, delay: 0.8, duration: 9, rotate: 12 },
  { icon: 'GraduationCap', top: '68%', left: '10%', size: 54, delay: 1.4, duration: 7.5, rotate: 6 },
  { icon: 'Users', top: '75%', left: '85%', size: 46, delay: 0.5, duration: 8.5, rotate: -8 },
  { icon: 'Sparkles', top: '38%', left: '92%', size: 34, delay: 1.1, duration: 6.5, rotate: 0 },
  { icon: 'PenTool', top: '30%', left: '3%', size: 36, delay: 0.3, duration: 7, rotate: -14 },
];

export default function Hero({ stats, onSelectTab }) {
  const content = useContent();
  const { hero, demoStats } = content;
  const EyebrowIcon = getIcon(hero.eyebrowIcon);
  const CtaIcon = getIcon(hero.ctaSecondaryIcon);

  const liveTotal = (stats.studentsCount || 0) + (stats.teachersNormalCount || 0) + (stats.teachersBadgeCount || 0);
  const demoTotal = demoStats.studentsCount + demoStats.teachersNormalCount + demoStats.teachersBadgeCount;
  const displayTotal = useCountUp(liveTotal > 0 ? liveTotal : demoTotal);

  return (
    <section id="top" className="hero">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__orbit hero__orbit--1" aria-hidden="true" />
      <div className="hero__orbit hero__orbit--2" aria-hidden="true" />
      <FloatingIcons items={BG_ICONS} />

      <div className="container hero__inner">
        <div className="eyebrow hero__anim" style={{ '--d': '0ms' }}>
          <EyebrowIcon size={14} /> {hero.eyebrow}
        </div>

        <h1 className="hero__headline hero__anim" style={{ '--d': '80ms' }}>
          {hero.headlineLine1}<br />
          <span className="text-gradient">{hero.headlineLine2}</span>
        </h1>

        <p className="hero__sub hero__anim" style={{ '--d': '160ms' }}>
          {hero.subtext}
        </p>

        <div className="hero__ctas hero__anim" style={{ '--d': '240ms' }}>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => onSelectTab?.('student')}>
            {hero.ctaPrimary} <ArrowRight size={18} />
          </button>
          <button type="button" className="btn btn-secondary-outline btn-lg" onClick={() => onSelectTab?.('teacher')}>
            <CtaIcon size={18} /> {hero.ctaSecondary}
          </button>
        </div>

        <div className="hero__proof hero__anim" style={{ '--d': '320ms' }}>
          
          <p>
            <strong>{displayTotal.toLocaleString('en-US')}+</strong> {hero.proofSuffix}
          </p>
        </div>
      </div>
    </section>
  );
}
