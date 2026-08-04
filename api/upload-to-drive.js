// api/upload-to-drive.js
//
// Vercel serverless function. Uploads a base64-encoded verification
// document to a folder in YOUR OWN Google Drive, using OAuth (not a
// service account — service accounts have no Drive storage quota of
// their own as of Google's policy change).
//
// See scripts/getDriveRefreshToken.mjs for the one-time setup that mints
// GOOGLE_OAUTH_REFRESH_TOKEN.

import { google } from 'googleapis';
import { Readable } from 'stream';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// Vercel's hard request-body limit is ~4.5MB regardless of any code
// config. Base64 inflates a file by ~33%, so reject early with a clear
// message instead of letting the platform silently fail the request.
const MAX_BASE64_BYTES = 4 * 1024 * 1024;

function getFirestorePrivateKey() {
  return (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n');
}

function getMissingDriveEnvVars() {
  const required = {
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REFRESH_TOKEN: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,
  };
  return Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
}

let dbInstance = null;
function getDb() {
  if (dbInstance) return dbInstance;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!projectId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return null; // rate limiting is best-effort, not required
  }
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          privateKey: getFirestorePrivateKey(),
        }),
      });
    }
    dbInstance = getFirestore();
    return dbInstance;
  } catch (err) {
    console.error('Firestore admin init failed (rate limiting disabled):', err.message);
    return null;
  }
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function checkRateLimit(db, ip) {
  const ref = db.collection('uploadRateLimits').doc(ip);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;

    if (!data || now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      tx.set(ref, { windowStart: now, count: 1 });
      return { allowed: true };
    }
    if (data.count >= RATE_LIMIT_MAX) {
      return { allowed: false, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - data.windowStart) };
    }
    tx.update(ref, { count: FieldValue.increment(1) });
    return { allowed: true };
  });
}

function sanitizeFilename(rawName) {
  const base = String(rawName || 'file').normalize('NFKD');
  let cleaned = base.replace(/[/\\?%*:|"<>\x00-\x1F]/g, '_').trim().replace(/\s+/g, '_');
  if (cleaned.length > 120) {
    const extMatch = cleaned.match(/\.[a-zA-Z0-9]{1,8}$/);
    const ext = extMatch ? extMatch[0] : '';
    cleaned = cleaned.slice(0, 120 - ext.length) + ext;
  }
  return cleaned || 'file';
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const missing = getMissingDriveEnvVars();
    if (missing.length) {
      res.status(500).json({
        error: `Server misconfigured — missing env var(s): ${missing.join(', ')}. Run scripts/getDriveRefreshToken.mjs and add the results in Vercel → Settings → Environment Variables, then redeploy.`,
      });
      return;
    }

    const { filename, mimeType, base64 } = req.body || {};
    if (!filename || !mimeType || !base64) {
      res.status(400).json({ error: 'filename, mimeType, and base64 are all required in the request body.' });
      return;
    }

    if (base64.length > MAX_BASE64_BYTES) {
      res.status(413).json({
        error: 'File is too large for this endpoint after encoding (max ~4MB). Please compress the image and try again.',
      });
      return;
    }

    try {
      const db = getDb();
      if (db) {
        const ip = getClientIp(req);
        const rate = await checkRateLimit(db, ip);
        if (!rate.allowed) {
          res.setHeader('Retry-After', Math.ceil(rate.retryAfterMs / 1000));
          res.status(429).json({ error: 'Too many uploads from this connection. Please try again later.' });
          return;
        }
      }
    } catch (err) {
      console.error('Rate limit check failed (continuing without it):', err.message);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });

    try {
      await oauth2Client.getAccessToken();
    } catch (err) {
      console.error('OAuth token refresh failed:', err.message);
      res.status(500).json({
        error: `Google authorization failed: ${err.message}. Your refresh token may have been revoked — re-run scripts/getDriveRefreshToken.mjs and update GOOGLE_OAUTH_REFRESH_TOKEN in Vercel.`,
      });
      return;
    }

    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const buffer = Buffer.from(base64, 'base64');
      const stream = Readable.from(buffer);
      const safeName = sanitizeFilename(filename);

      const createRes = await drive.files.create({
        requestBody: { name: `${Date.now()}_${safeName}`, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] },
        media: { mimeType, body: stream },
        fields: 'id, webViewLink',
      });

      res.status(200).json({ fileId: createRes.data.id, webViewLink: createRes.data.webViewLink });
    } catch (err) {
      const reason = err?.response?.data?.error?.message || err.message;
      console.error('Drive upload failed:', reason);
      res.status(500).json({
        error: `Google Drive upload failed: ${reason}. Check that GOOGLE_DRIVE_FOLDER_ID is a folder that exists in the same Google account you authorized in Step 2.`,
      });
    }
  } catch (err) {
    console.error('Unhandled error in upload-to-drive:', err);
    res.status(500).json({ error: `Unexpected server error: ${err.message}` });
  }
}