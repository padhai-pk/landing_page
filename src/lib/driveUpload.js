// src/lib/driveUpload.js
import { validateDocFile } from './fileValidation.js';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — keep comfortably under Vercel's body limit

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Uploads a single File to the shared Google Drive verification folder via
// /api/upload-to-drive. Returns { fileId, webViewLink } or throws.
export async function uploadFileToDrive(file) {
  if (!file) return null;

  const check = validateDocFile(file);
  if (!check.valid) {
    throw new Error(check.reason);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`"${file.name}" is too large (max 8MB). Please compress it and try again.`);
  }

  const base64 = await fileToBase64(file);

  const res = await fetch('/api/upload-to-drive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, mimeType: file.type || 'application/octet-stream', base64 }),
  });

  if (res.status === 429) {
    throw new Error('Too many uploads right now — please wait a bit and try again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Document upload failed. Please try again.');
  }

  return res.json();
}