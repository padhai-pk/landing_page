import React from 'react';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import useCountUp from '../hooks/useCountUp.js';
import './Hero.css';
import { DEMO_STATS } from '../lib/demoData.js';

export default function Hero({ stats }) {
  const liveTotal = (stats.studentsCount || 0) + (stats.teachersNormalCount || 0) + (stats.teachersBadgeCount || 0);
  const demoTotal = DEMO_STATS.studentsCount + DEMO_STATS.teachersNormalCount + DEMO_STATS.teachersBadgeCount;
  const displayTotal = useCountUp(liveTotal > 0 ? liveTotal : demoTotal);
  
  return (
    <section id="top" className="hero">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__orbit hero__orbit--1" aria-hidden="true" />
      <div className="hero__orbit hero__orbit--2" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="eyebrow hero__anim" style={{ '--d': '0ms' }}>
          <Sparkles size={14} /> Pre-launch · open to students &amp; teachers worldwide
        </div>

        <h1 className="hero__headline hero__anim" style={{ '--d': '80ms' }}>
          Padhna ho ya Padhana,<br />
          <span className="text-gradient">sirf Padhai.pk pr aana.</span>
        </h1>

        <p className="hero__sub hero__anim" style={{ '--d': '160ms' }}>
          Post what you need to learn, get proposals from verified tutors, and pay only when the
          session happens — held safely in escrow. Free to learn. Real to earn. Built in Urdu, priced in PKR.
        </p>

        <div className="hero__ctas hero__anim" style={{ '--d': '240ms' }}>
          <a href="#waitlist" className="btn btn-primary btn-lg">
            Join as a student <ArrowRight size={18} />
          </a>
          <a href="#badge-program" className="btn btn-outline btn-lg">
            <GraduationCap size={18} /> I'm a teacher — claim a free badge seat
          </a>
        </div>

        <div className="hero__proof hero__anim" style={{ '--d': '320ms' }}>
          <div className="hero__avatars" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <p>
            <strong>{displayTotal.toLocaleString('en-US')}+</strong> students &amp; teachers
            already on the waitlist — before a single rupee of marketing spend.
          </p>
        </div>
      </div>
    </section>
  );
}
