import React from 'react';
import { ArrowLeftRight, PenLine, TrendingUp, Star, Video, Lock, Landmark, Wallet } from 'lucide-react';
import Reveal from './Reveal.jsx';
import './FeaturesGrid.css';

const FEATURES = [
  { icon: <ArrowLeftRight size={20} />, title: 'Tutor marketplace', text: 'Students post requests, teachers send proposals — a real bidding marketplace, not a static directory.' },
  { icon: <PenLine size={20} />, title: 'Posts & proposals', text: 'Subject, budget, and city drive every match. Teachers pitch with price and a short intro.' },
  { icon: <TrendingUp size={20} />, title: 'Profile & post boosts', text: 'Teachers boost their profile to rank higher; students boost urgent posts for faster proposals.' },
  { icon: <Star size={20} />, title: 'Proposal subscriptions', text: 'A monthly plan gives teachers extra proposals once they outgrow the free monthly quota.' },
  { icon: <Video size={20} />, title: 'Live sessions on Jitsi', text: 'In-app video for demos and paid classes — no separate app, no shared personal numbers.' },
  { icon: <Lock size={20} />, title: 'Escrow payments', text: 'Student payment is held safely and only released to the teacher once a session is confirmed complete.' },
  { icon: <Landmark size={20} />, title: 'Connected payouts', text: 'Teachers link a bank account or mobile wallet directly to the platform to receive earnings.' },
  { icon: <Wallet size={20} />, title: 'JazzCash · EasyPaisa · Card', text: 'Pay the way Pakistan actually pays — no foreign card required.' },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="section features">
      <div className="container">
        <Reveal>
          <div className="features__head">
            <div className="eyebrow">What's in the MVP</div>
            <h2>Built lean. Built for launch.</h2>
            <p>Every feature below is scoped, scheduled, and already under development.</p>
          </div>
        </Reveal>

        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 80}>
              <div className="features__card">
                <span className="features__icon" aria-hidden="true">{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}