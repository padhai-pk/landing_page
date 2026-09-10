import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme.jsx';
import { ContentProvider } from './lib/content.jsx';
import LandingPage from './pages/LandingPage.jsx';
import BadgeApplicationPage from './pages/BadgeApplicationPage.jsx';
import SharePage from './pages/SharePage.jsx';
import AmbassadorSignupPage from './pages/AmbassadorSignupPage.jsx';
import WhatsAppFloat from './components/WhatsAppFloat.jsx';
import { isAmbassadorHost, AMBASSADOR_SITE_URL } from './lib/hosts.js';

function AmbassadorSignupEntry() {
  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
    if (isLocal || isAmbassadorHost()) return;
    window.location.replace(AMBASSADOR_SITE_URL);
  }, []);

  return <AmbassadorSignupPage />;
}

function AppRoutes() {
  if (isAmbassadorHost()) {
    return (
      <Routes>
        <Route path="/share" element={<SharePage />} />
        <Route path="*" element={<AmbassadorSignupPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/badge-application" element={<BadgeApplicationPage />} />
      <Route path="/share" element={<SharePage />} />
      <Route path="/ambassador-signup" element={<AmbassadorSignupEntry />} />
    </Routes>
  );
}

export default function App() {
  const onAmbassadorHost = isAmbassadorHost();

  return (
    <ThemeProvider>
      <ContentProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
          {!onAmbassadorHost && <WhatsAppFloat />}
        </BrowserRouter>
      </ContentProvider>
    </ThemeProvider>
  );
}
