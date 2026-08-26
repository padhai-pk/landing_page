import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fetchInstagramProfileImage, parseInstagramUsername } from './api/lib/fetchInstagramProfile.js';

function instagramProfileApiPlugin() {
  return {
    name: 'instagram-profile-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/universities')) return next();

        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed.' }));
          return;
        }

        const url = new URL(req.url, 'http://localhost');
        const country = url.searchParams.get('country')?.trim();
        if (!country) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'country query parameter is required.' }));
          return;
        }

        try {
          const params = new URLSearchParams({ country });
          const upstream = await fetch(`http://universities.hipolabs.com/search?${params.toString()}`, {
            headers: { Accept: 'application/json' },
          });
          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'University lookup failed.' }));
            return;
          }
          const data = await upstream.json();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(JSON.stringify(Array.isArray(data) ? data : []));
        } catch (err) {
          console.error('universities lookup failed:', err.message);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Could not reach the university directory.' }));
        }
      });

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/instagram-profile')) return next();

        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed.' }));
          return;
        }

        const url = new URL(req.url, 'http://localhost');
        const username = parseInstagramUsername(url.searchParams.get('username'));
        if (!username) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'A valid Instagram username is required.' }));
          return;
        }

        try {
          const profile = await fetchInstagramProfileImage(username);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.end(JSON.stringify(profile));
        } catch (err) {
          console.error('instagram-profile lookup failed:', err.message);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Could not fetch Instagram profile image.' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), instagramProfileApiPlugin()],
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    port: 5173,
    proxy: {
      // Local dev: avoid CORS by proxying API calls through Vite.
      // Set VITE_BACKEND_URL=/api/backend in .env while running npm run dev.
      '/api/backend': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/backend/, ''),
      },
    },
  },
});
