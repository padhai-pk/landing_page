import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_CONTENT } from './defaultContent.js';

const ContentContext = createContext(null);

// Fetches /content.json at runtime (NOT bundled at build time) so the team
// can edit copy, FAQs, stats, logo path, etc. by editing that one file and
// redeploying — no component code changes needed. Falls back to a built-in
// default so the site never breaks if the fetch fails.
export function ContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/content.json', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('content.json not found'))))
      .then((data) => {
        if (!cancelled) setContent({ ...DEFAULT_CONTENT, ...data });
      })
      .catch(() => {
        // Keep DEFAULT_CONTENT — site remains fully functional.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <ContentContext.Provider value={{ content, loaded }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within a ContentProvider');
  return ctx.content;
}
