import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import StatsStrip from '../components/StatsStrip.jsx';
import ProblemSection from '../components/ProblemSection.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import FeaturesGrid from '../components/FeaturesGrid.jsx';
import SeatProgram from '../components/SeatProgram.jsx';
import WaitlistSection from '../components/WaitlistSection.jsx';
import FAQSection from '../components/FAQSection.jsx';
import ContactSection from '../components/ContactSection.jsx';
import Footer from '../components/Footer.jsx';
import Toast from '../components/Toast.jsx';
import BackToTop from '../components/BackToTop.jsx';
import InstagramPopup from '../components/InstagramPopup.jsx';
import { listenToBootstrap } from '../lib/waitlist.js';

export default function LandingPage() {
  const [subjects, setSubjects] = useState(null);
  const [stats, setStats] = useState({ studentsCount: 0, teachersNormalCount: 0, teachersBadgeCount: 0 });
  const [toast, setToast] = useState(null);
  const [waitlistTab, setWaitlistTab] = useState('student');

  function goToWaitlist(tab) {
    setWaitlistTab(tab);
    const el = document.getElementById('waitlist');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  useEffect(() => {
    const unsub = listenToBootstrap({
      onSubjects: setSubjects,
      onStats: setStats,
    });
    return unsub;
  }, []);

  const showToast = useCallback((toastData) => {
    setToast(toastData);
  }, []);

  return (
    <>
      <Navbar />
      <main>
      <Hero stats={stats} onSelectTab={goToWaitlist} />
        <StatsStrip stats={stats} subjects={subjects} />
        <ProblemSection />
        <HowItWorks />
        <FeaturesGrid />
        <SeatProgram subjects={subjects} />
        <WaitlistSection subjects={subjects} onResult={showToast} activeTab={waitlistTab} onTabChange={setWaitlistTab} />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <BackToTop />
      <InstagramPopup />
    </>
  );
}
