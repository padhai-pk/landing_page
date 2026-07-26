import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './lib/theme.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import StatsStrip from './components/StatsStrip.jsx';
import ProblemSection from './components/ProblemSection.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import FeaturesGrid from './components/FeaturesGrid.jsx';
import SeatProgram from './components/SeatProgram.jsx';
import WaitlistSection from './components/WaitlistSection.jsx';
import FAQSection from './components/FAQSection.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
import BackToTop from './components/BackToTop.jsx';
import { listenToSubjects, listenToStats } from './lib/waitlist.js';

function AppShell() {
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({ studentsCount: 0, teachersNormalCount: 0, teachersBadgeCount: 0 });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsubSubjects = listenToSubjects(setSubjects);
    const unsubStats = listenToStats(setStats);
    return () => {
      unsubSubjects();
      unsubStats();
    };
  }, []);

  const showToast = useCallback((toastData) => {
    setToast(toastData);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero stats={stats} />
        <StatsStrip stats={stats} subjects={subjects} />
        <ProblemSection />
        <HowItWorks />
        <FeaturesGrid />
        <SeatProgram subjects={subjects} />
        <WaitlistSection subjects={subjects} onResult={showToast} />
        <FAQSection />
      </main>
      <Footer />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <BackToTop />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
