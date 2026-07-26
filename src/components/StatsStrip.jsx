import React, { useMemo } from 'react';
import { Users, GraduationCap, BookOpen, ShieldCheck } from 'lucide-react';
import useCountUp from '../hooks/useCountUp.js';
import { DEMO_STATS, DEMO_SEATS_CLAIMED, DEMO_SEATS_TOTAL } from '../lib/demoData.js';
import './StatsStrip.css';

function StatItem({ icon, value, label, isNumeric = true }) {
  const display = useCountUp(isNumeric ? value : 0, 1400);
  return (
    <div className="stats-strip__item">
      <span className="stats-strip__icon">{icon}</span>
      <span className="stats-strip__value">
        {isNumeric ? display.toLocaleString('en-US') : value}
      </span>
      <span className="stats-strip__label">{label}</span>
    </div>
  );
}

export default function StatsStrip({ stats, subjects }) {
  const hasLiveData =
    (stats.studentsCount || 0) + (stats.teachersNormalCount || 0) + (stats.teachersBadgeCount || 0) > 0;

  const effectiveStats = hasLiveData ? stats : DEMO_STATS;

  const seatsClaimed = useMemo(() => {
    if (subjects.length === 0) return DEMO_SEATS_CLAIMED;
    const claimed = subjects.reduce((sum, s) => sum + (s.badgeSeatsFilled || 0), 0);
    return claimed > 0 ? claimed : DEMO_SEATS_CLAIMED;
  }, [subjects]);

  const seatsTotal = useMemo(() => {
    if (subjects.length === 0) return DEMO_SEATS_TOTAL;
    return subjects.reduce((sum, s) => sum + (s.badgeSeatsMax || 0), 0);
  }, [subjects]);

  const subjectCount = subjects.length || 67;

  return (
    <section className="stats-strip">
      <div className="container stats-strip__grid">
        <StatItem
          icon={<Users size={20} />}
          value={effectiveStats.studentsCount}
          label="Students waiting"
        />
        <StatItem
          icon={<GraduationCap size={20} />}
          value={effectiveStats.teachersNormalCount + effectiveStats.teachersBadgeCount}
          label="Teachers waiting"
        />
        <StatItem
          icon={<BookOpen size={20} />}
          value={subjectCount}
          label="Subjects covered"
        />
        <StatItem
          icon={<ShieldCheck size={20} />}
          value={seatsClaimed}
          label={`Verified badge seats claimed (of ${seatsTotal})`}
        />
      </div>
      {!hasLiveData && <p className="stats-strip__demo-note">Showing demo numbers until live signups come in.</p>}
    </section>
  );
}