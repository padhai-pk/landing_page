import React from 'react';
import Reveal from './Reveal.jsx';
import FloatingIcons from './FloatingIcons.jsx';
import { useContent } from '../lib/content.jsx';
import { getIcon } from '../lib/icons.js';
import './ProblemSection.css';

const BG_ICONS = [
  { icon: 'BookOpen', top: '8%', left: '4%', size: 58, delay: 0, duration: 8, rotate: -8 },
  { icon: 'Notebook', top: '14%', left: '88%', size: 48, delay: 1.2, duration: 9, rotate: 10 },
  { icon: 'PencilRuler', top: '80%', left: '8%', size: 44, delay: 0.6, duration: 7.5, rotate: 14 },
  { icon: 'Lightbulb', top: '70%', left: '90%', size: 40, delay: 0.9, duration: 8, rotate: -6 },
];

export default function ProblemSection() {
  const content = useContent();
  const { eyebrow, heading, body, cards } = content.problem;

  return (
    <section className="section problem">
      <FloatingIcons items={BG_ICONS} />
      <div className="container">
        <Reveal>
          <div className="problem__head">
            <div className="eyebrow">{eyebrow}</div>
            <h2>{heading.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}</h2>
            <p>{body}</p>
          </div>
        </Reveal>

        <div className="problem__grid">
          {cards.map((c, i) => {
            const Icon = getIcon(c.icon);
            return (
              <Reveal key={c.who} delay={i * 100}>
                <article className="problem__card">
                  <div className="problem__card-head">
                    <span className="problem__icon"><Icon size={22} /></span>
                    <div className="problem__card-heading">
                      <span className="problem__tag">{c.tag}</span>
                      <h4>{c.who}</h4>
                    </div>
                  </div>
                  <p>{c.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
