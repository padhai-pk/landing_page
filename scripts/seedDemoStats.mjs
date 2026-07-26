import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

await db.doc('stats/global').set({
  studentsCount: 184,
  teachersNormalCount: 67,
  teachersBadgeCount: 41,
}, { merge: true });

// Claim demo seats on a few subjects so the "seats" grid isn't all empty
const demoClaims = { 'python': 2, 'fsc-biology': 1, 'ielts': 2, 'digital-marketing': 1 };
for (const [id, filled] of Object.entries(demoClaims)) {
  await db.doc(`subjects/${id}`).set({ badgeSeatsFilled: filled }, { merge: true });
}

console.log('Demo stats seeded.');