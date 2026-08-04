// src/lib/driveUpload.js
import { validateDocFile } from './fileValidation.js';

// Vercel's request body limit is a hard ~4.5MB regardless of any code
// config — base64 inflates a file by ~33%, so the RAW file needs to stay
// well under that after encoding.
const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3MB raw → ~4MB base64

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadFileToDrive(file) {
  if (!file) return null;

  const check = validateDocFile(file);
  if (!check.valid) throw new Error(check.reason);
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`"${file.name}" is too large (max 3MB). Most camera apps have a "smaller size" or "medium quality" option — try that and re-select the file.`);
  }

  const base64 = await fileToBase64(file);

  let res;
  try {
    res = await fetch('/api/upload-to-drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, mimeType: file.type || 'application/octet-stream', base64 }),
    });
  } catch {
    throw new Error('Could not reach the upload service — check your internet connection and try again.');
  }

  if (res.ok) return res.json();

  if (res.status === 429) {
    throw new Error('Too many uploads right now — please wait a bit and try again.');
  }

  // Surface the real reason, but don't crash if the error response isn't
  // JSON (e.g. a raw platform-level 413/504 page).
  let message = `Upload failed (HTTP ${res.status}).`;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
    try {
      const text = await res.text();
      if (text) message = `Upload failed (HTTP ${res.status}): ${text.slice(0, 200)}`;
    } catch { /* give up, use the generic message */ }
  }
  throw new Error(message);
}

