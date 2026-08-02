// api/upload-to-drive.js
//
// Vercel serverless function (Node runtime). Receives a single base64-encoded
// file from the badge application form and uploads it into a Google Drive
// folder using a service account — no per-teacher Google login required.
//
// ── ONE-TIME SETUP ──────────────────────────────────────────────────────
// 1. Google Cloud Console → create a project (or reuse one) → enable the
//    "Google Drive API".
// 2. IAM & Admin → Service Accounts → Create service account → Create key
//    (JSON) → download it.
// 3. In Google Drive, create a folder for verification documents, then
//    Share it with the service account's email address (found in the JSON
//    key as `client_email`) — give it "Editor" access.
// 4. In Vercel → Project → Settings → Environment Variables, add:
//      GOOGLE_SERVICE_ACCOUNT_EMAIL   = the client_email from the JSON key
//      GOOGLE_SERVICE_ACCOUNT_KEY     = the private_key from the JSON key
//                                       (paste it with literal \n newlines;
//                                       this code un-escapes them below)
//      GOOGLE_DRIVE_FOLDER_ID         = the folder's ID (from its URL)
// 5. Redeploy.
//
// Request body: { filename: string, mimeType: string, base64: string }
// Response:     { fileId: string, webViewLink: string }

import { google } from 'googleapis';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { filename, mimeType, base64 } = req.body || {};
    if (!filename || !mimeType || !base64) {
      res.status(400).json({ error: 'filename, mimeType, and base64 are required' });
      return;
    }

    const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!privateKey || !clientEmail || !folderId) {
      res.status(500).json({
        error: 'Server is missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_DRIVE_FOLDER_ID env vars.',
      });
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

    const createRes = await drive.files.create({
      requestBody: {
        name: `${Date.now()}_${filename}`,
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
