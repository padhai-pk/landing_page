import React, { useMemo } from 'react';
import { Users, GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';
import useCountUp from '../hooks/useCountUp.js';
import Reveal from './Reveal.jsx';
import { useContent } from '../lib/content.jsx';
import './StatsStrip.css';

function StatItem({ icon, value, label, isNumeric = true, delay = 0 }) {
  const display = useCountUp(isNumeric ? value : 0, 1400);
  return (
    <Reveal delay={delay} className="stats-strip__item">
      <span className="stats-strip__icon">{icon}</span>
      <span className="stats-strip__value">
        {isNumeric ? display.toLocaleString('en-US') : value}
      </span>
      <span className="stats-strip__label">{label}</span>
    </Reveal>
  );
}

export default function StatsStrip({ stats, subjects }) {
  const { demoStats } = useContent();

  // Firestore hasn't reported any real signups yet (fresh project, still
  // offline, or genuinely zero so far) — show believable demo numbers
  // instead of an empty-looking "0" strip. Swaps to live numbers the
  // instant real data exists.
  const hasLiveData =
    (stats.studentsCount || 0) + (stats.teachersNormalCount || 0) + (stats.teachersBadgeCount || 0) > 0;
  const effectiveStats = hasLiveData ? stats : demoStats;

  const seatsClaimed = useMemo(() => {
    if (!subjects?.length) return demoStats.seatsClaimed;
    const claimed = stats.teachersBadgeCount ;
    return claimed > 0 ? claimed : demoStats.seatsClaimed;
  }, [subjects, demoStats.seatsClaimed]);

  const seatsTotal = useMemo(() => {
    if (!subjects?.length) return demoStats.seatsTotal;
    return subjects.reduce((sum, s) => sum + (s.badgeSeatsMax || 0), 0);
  }, [subjects, demoStats.seatsTotal]);

  const subjectCount = subjects?.length || Math.round(demoStats.seatsTotal / 2);

  return (
    <section className="stats-strip">
      <div className="container stats-strip__grid">
        <StatItem icon={<Users size={20} />} value={effectiveStats.studentsCount} label="Students waiting" delay={0} />
        <StatItem
          icon={<GraduationCap size={20} />}
          value={effectiveStats.teachersNormalCount + seatsClaimed}
          label="Teachers waiting"
          delay={80}
        />
        <StatItem icon={<BookOpen size={20} />} value={subjectCount} label="Subjects covered" delay={160} />
        <StatItem
          icon={<ShieldCheck size={20} />}
          value={seatsClaimed}
          label={`Verified badge seats claimed (of 250)`}
          delay={240}
        />
      </div>
      {!hasLiveData && <p className="stats-strip__demo-note">Showing illustrative numbers until live signups come in.</p>}
    </section>
  );
}
