// src/lib/fileValidation.js
// Frontend-only validation for verification document uploads: both the
// browser-reported MIME type AND the filename extension must match one of
// the allowed document types below. This catches accidental wrong-file
// selections and casual renaming tricks — it does NOT stop someone from
// calling the upload API directly with a script, since that bypasses the
// browser (and therefore this file) entirely.

export const ALLOWED_DOC_TYPES = [
    { mime: 'image/jpeg', exts: ['.jpg', '.jpeg'] },
    { mime: 'image/png', exts: ['.png'] },
    { mime: 'image/webp', exts: ['.webp'] },
    { mime: 'application/pdf', exts: ['.pdf'] },
  ];
  
  export const ACCEPTED_DOC_INPUT_ATTR =
    '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';
  
  export function validateDocFile(file) {
    if (!file) return { valid: false, reason: 'No file selected.' };
  
    const name = (file.name || '').toLowerCase();
    const match = ALLOWED_DOC_TYPES.find((t) => t.mime === file.type);
  
    if (!match) {
      return { valid: false, reason: 'Only JPG, PNG, WEBP, or PDF files are allowed.' };
    }
    if (!match.exts.some((ext) => name.endsWith(ext))) {
      return { valid: false, reason: `File extension doesn't match its type (expected ${match.exts.join(' or ')}).` };
    }
    return { valid: true };
  }