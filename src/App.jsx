import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme.jsx';
import { ContentProvider } from './lib/content.jsx';
import LandingPage from './pages/LandingPage.jsx';
import BadgeApplicationPage from './pages/BadgeApplicationPage.jsx';
import SharePage from './pages/SharePage.jsx';
import WhatsAppFloat from './components/WhatsAppFloat.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/badge-application" element={<BadgeApplicationPage />} />
            <Route path="/share" element={<SharePage />} />
          </Routes>
          <WhatsAppFloat />
        </BrowserRouter>
      </ContentProvider>
    </ThemeProvider>
  );
}
