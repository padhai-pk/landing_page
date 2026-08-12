// src/lib/driveUpload.js
import { validateDocFile } from './fileValidation.js';
import { formatUploadError, networkErrorMessage } from './apiErrors.js';
import { postToBackend } from './backend.js';

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

  try {
    return await postToBackend('/upload-to-drive', {
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64,
    });
  } catch (err) {
    const msg = err?.message || '';
    if (!msg || msg.includes('Could not reach')) throw new Error(networkErrorMessage());
    throw new Error(formatUploadError(msg));
  }
}

