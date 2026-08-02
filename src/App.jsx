import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme.jsx';
import { ContentProvider } from './lib/content.jsx';
import LandingPage from './pages/LandingPage.jsx';
import BadgeApplicationPage from './pages/BadgeApplicationPage.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/badge-application" element={<BadgeApplicationPage />} />
          </Routes>
        </BrowserRouter>
      </ContentProvider>
    </ThemeProvider>
  );
}
