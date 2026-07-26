import React from 'react';
import { UserRound, Lightbulb, Unlink } from 'lucide-react';
import Reveal from './Reveal.jsx';
import './ProblemSection.css';

const CARDS = [
  {
    icon: <UserRound size={22} />,
    who: 'Ali, 17 — needs a teacher',
    tag: 'The learner',
    text: "Appearing in FSc Pre-Medical. His academy wants Rs. 4,000/month — money his family doesn't have. A tutor from a Facebook group took his father's advance and never came back.",
  },
  {
    icon: <Lightbulb size={22} />,
    who: 'Fatima, 21 — has the answer',
    tag: 'The teacher',
    text: 'Tops her class in Python and Web Dev. Already tutors two juniors for free — no trustworthy place to list herself, no safe way to get paid, no proof of her track record.',
  },
  {
    icon: <Unlink size={22} />,
    who: 'The gap between them',
    tag: 'No trust layer',
    text: "They're a five-minute conversation apart. But nothing verifies either side, protects payment, or holds anyone accountable — so both stay stuck.",
  },
];

export default function ProblemSection() {
  return (
    <section className="section problem">
      <div className="container">
        <Reveal>
          <div className="problem__head">
            <div className="eyebrow">The problem</div>
            <h2>Pakistan's tutoring economy runs on trust.<br />Nothing is built to protect it.</h2>
            <p>
              25.1 million Pakistani children are out of school, and the private tutoring market that fills the
              gap is almost entirely informal — WhatsApp groups, paper ads, word of mouth. No verification.
              No escrow. No accountability when it goes wrong.
            </p>
          </div>
        </Reveal>

        <div className="problem__grid">
          {CARDS.map((c, i) => (
            <Reveal key={c.who} delay={i * 100}>
              <article className="problem__card">
                <span className="problem__icon">{c.icon}</span>
                <span className="problem__tag">{c.tag}</span>
                <h4>{c.who}</h4>
                <p>{c.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
