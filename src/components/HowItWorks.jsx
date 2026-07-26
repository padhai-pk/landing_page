import React from 'react';
import { FileEdit, Send, Video, Lock, BadgeCheck } from 'lucide-react';
import Reveal from './Reveal.jsx';
import './HowItWorks.css';

const STEPS = [
  { n: '01', icon: <FileEdit size={20} />, title: 'Post what you need', text: 'Subject, level, budget, city. Takes under a minute.' },
  { n: '02', icon: <Send size={20} />, title: 'Teachers send proposals', text: 'Verified tutors bid with a price and a short pitch — Upwork-style.' },
  { n: '03', icon: <Video size={20} />, title: 'Free demo, in-app', text: 'A 20-minute session over Jitsi before anyone commits to anything.' },
  { n: '04', icon: <Lock size={20} />, title: 'Pay into escrow', text: 'JazzCash, EasyPaisa, or card. Held safely until the session is confirmed done.' },
  { n: '05', icon: <BadgeCheck size={20} />, title: 'Teacher gets paid', text: 'Released automatically after confirmation. Both sides leave a review.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section howit">
      <div className="container">
        <Reveal>
          <div className="howit__head">
            <div className="eyebrow">How it works</div>
            <h2>Five steps. No WhatsApp gambling.</h2>
          </div>
        </Reveal>

        <ol className="howit__list">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} as="li" delay={i * 90} className="howit__step">
              <span className="howit__num">
                <span className="howit__num-icon">{s.icon}</span>
                {s.n}
              </span>
              <div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
