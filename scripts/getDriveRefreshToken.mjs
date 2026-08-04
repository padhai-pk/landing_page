// scripts/getDriveRefreshToken.mjs
//
// One-time script: run this on your own machine to authorize this app
// against YOUR Google account and mint a refresh token. Paste the printed
// refresh token into Vercel as GOOGLE_OAUTH_REFRESH_TOKEN.
//
// Run:
//   GOOGLE_OAUTH_CLIENT_ID=xxx GOOGLE_OAUTH_CLIENT_SECRET=yyy node scripts/getDriveRefreshToken.mjs
//
// A browser tab opens automatically — sign in with the Google account whose
// Drive should receive uploaded documents, and approve access. You'll
// likely see an "unverified app" warning since this app hasn't been
// reviewed by Google — click "Advanced" → "Go to <app name> (unsafe)" to
// continue. That's expected and safe; it's your own app, running on your
// own machine, only you will ever use it.

import http from 'node:http';
import { google } from 'googleapis';

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET env vars before running this script.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces Google to return a refresh_token even on re-runs
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

console.log('\nOpen this URL and sign in with the Google account whose Drive\nshould receive uploaded documents:\n');
console.log(authUrl + '\n');

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(`Authorization failed: ${error}. You can close this tab.`);
    console.error('Authorization failed:', error);
    server.close();
    process.exit(1);
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Success! You can close this tab and return to your terminal.');

    console.log('\n✅ Success. Add these to Vercel → Project → Settings → Environment Variables:\n');
    console.log('GOOGLE_OAUTH_CLIENT_ID     =', clientId);
    console.log('GOOGLE_OAUTH_CLIENT_SECRET =', clientSecret);
    console.log('GOOGLE_OAUTH_REFRESH_TOKEN =', tokens.refresh_token || '(none returned — see note below)');

    if (!tokens.refresh_token) {
      console.log(
        '\nNo refresh_token was returned — this usually means you\'ve already\n' +
        'authorized this app before. Go to https://myaccount.google.com/permissions,\n' +
        'remove access for this app, then run this script again.'
      );
    }
  } catch (err) {
    console.error('Failed to exchange code for tokens:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT, () => {
  console.log(`Waiting for you to finish signing in... (listening on ${REDIRECT_URI})`);
});
