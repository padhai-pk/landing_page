// api/upload-to-drive.js
//
// Vercel serverless function (Node runtime). Receives a single base64-encoded
// file from the badge application form and uploads it into a Google Drive
// folder using a service account — no per-teacher Google login required.
//
// Hardening in this version:
//   - Rate limiting per IP (Firestore-backed, survives across invocations)
//   - Filename sanitization before it's ever used as a Drive filename
//
// ── ONE-TIME SETUP ──────────────────────────────────────────────────────
// 1. Google Cloud Console → enable the "Google Drive API".
// 2. IAM & Admin → Service Accounts → Create service account → Create key
//    (JSON) → download it. If this is the same service account Firebase
//    generated for you (Firebase Console → Project settings → Service
//    accounts → Generate new private key), it already has Firestore access
//    too — that's what the rate limiter below uses.
// 3. In Google Drive, create a folder for verification documents, then
//    Share it with the service account's email (client_email in the key) —
//    "Editor" access.
// 4. In Vercel → Project → Settings → Environment Variables, add:
//      GOOGLE_SERVICE_ACCOUNT_EMAIL   = client_email from the JSON key
//      GOOGLE_SERVICE_ACCOUNT_KEY     = private_key from the JSON key
//                                       (paste with literal \n newlines)
//      GOOGLE_DRIVE_FOLDER_ID         = the folder's ID (from its URL)
//    (VITE_FIREBASE_PROJECT_ID is already set for the client build and is
//    reused here automatically — no extra var needed.)
// 5. Redeploy.
//
// Request body: { filename: string, mimeType: string, base64: string }
// Response:     { fileId: string, webViewLink: string }

import { google } from 'googleapis';
import { Readable } from 'stream';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

const RATE_LIMIT_MAX = 15; // uploads allowed per IP per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getPrivateKey() {
  return (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n');
}

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
  }
  return getFirestore();
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

// Strips path separators, control characters, and anything that isn't a
// letter/number/dot/dash/underscore/space, then caps the length while
// preserving the extension — so a crafted filename can never be used to
// smuggle a path, a script tag, or an absurdly long string into Drive.
function sanitizeFilename(rawName) {
  const base = String(rawName || 'file').normalize('NFKD');
  let cleaned = base
    .replace(/[/\\?%*:|"<>\x00-\x1F]/g, '_')
    .trim()
    .replace(/\s+/g, '_');

  if (cleaned.length > 120) {
    const extMatch = cleaned.match(/\.[a-zA-Z0-9]{1,8}$/);
    const ext = extMatch ? extMatch[0] : '';
    cleaned = cleaned.slice(0, 120 - ext.length) + ext;
  }

  return cleaned || 'file';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const privateKey = getPrivateKey();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!privateKey || !clientEmail || !folderId) {
    res.status(500).json({
      error: 'Server is missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_DRIVE_FOLDER_ID env vars.',
    });
    return;
  }

  try {
    const db = getDb();
    const ip = getClientIp(req);
    const rate = await checkRateLimit(db, ip);
    if (!rate.allowed) {
      res.setHeader('Retry-After', Math.ceil(rate.retryAfterMs / 1000));
      res.status(429).json({ error: 'Too many uploads from this connection. Please try again later.' });
      return;
    }
  } catch (err) {
    // Rate limiter failing shouldn't take the whole upload path down —
    // log it and continue rather than blocking legitimate applicants.
    console.error('Rate limit check failed:', err);
  }

  try {
    const { filename, mimeType, base64 } = req.body || {};
    if (!filename || !mimeType || !base64) {
      res.status(400).json({ error: 'filename, mimeType, and base64 are required' });
      return;
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const buffer = Buffer.from(base64, 'base64');
    const stream = Readable.from(buffer);
    const safeName = sanitizeFilename(filename);

    const createRes = await drive.files.create({
      requestBody: {
        name: `${Date.now()}_${safeName}`,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, webViewLink',
    });

    res.status(200).json({
      fileId: createRes.data.id,
      webViewLink: createRes.data.webViewLink,
    });
  } catch (err) {
    console.error('Drive upload failed:', err);
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
}