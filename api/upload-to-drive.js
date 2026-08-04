// api/upload-to-drive.js
//
// Vercel serverless function. Uploads a base64-encoded verification
// document to a shared Google Drive folder via a service account.
//
// Every failure path below returns a specific, human-readable error in the
// JSON response — check your browser's Network tab (or curl the endpoint
// directly, see README) to see exactly which step failed, without needing
// access to Vercel's dashboard logs.

import { google } from 'googleapis';
import { Readable } from 'stream';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// Vercel's hard request-body limit is ~4.5MB regardless of any app-level
// config. Base64 inflates a file by ~33%, so we reject early with a clear
// message instead of letting the platform silently 413 the request.
const MAX_BASE64_BYTES = 4 * 1024 * 1024;

function getPrivateKey() {
  return (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n');
}

function getMissingEnvVars() {
  const required = {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,
  };
  return Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
}

let dbInstance = null;
function getDb() {
  // Rate limiting is best-effort. If Firestore admin init isn't available
  // for any reason, we skip rate limiting rather than fail the upload.
  if (dbInstance) return dbInstance;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          privateKey: getPrivateKey(),
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

    const missing = getMissingEnvVars();
    if (missing.length) {
      res.status(500).json({
        error: `Server misconfigured — missing env var(s): ${missing.join(', ')}. Add them in Vercel → Project → Settings → Environment Variables (for Production, Preview, AND Development), then redeploy.`,
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

    // Rate limiting — best effort, never blocks the upload if it errors.
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

    let auth;
    try {
      auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: getPrivateKey(),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      await auth.authorize();
    } catch (err) {
      console.error('Google auth failed:', err.message);
      res.status(500).json({
        error: `Google authentication failed: ${err.message}. Double-check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY were copied exactly from the JSON key (the key must include the literal "\\n" line breaks).`,
      });
      return;
    }

    try {
      const drive = google.drive({ version: 'v3', auth });
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
        error: `Google Drive upload failed: ${reason}. Check that GOOGLE_DRIVE_FOLDER_ID is correct and that the folder is shared with ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL} as Editor, and that the Drive API is enabled on your Google Cloud project.`,
      });
    }
  } catch (err) {
    console.error('Unhandled error in upload-to-drive:', err);
    res.status(500).json({ error: `Unexpected server error: ${err.message}` });
  }
}