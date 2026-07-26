// scripts/seedSubjects.mjs
//
// Setup:
//   npm i -D firebase-admin
//   Firebase Console → Project settings → Service accounts →
//     Generate new private key → save as scripts/serviceAccountKey.json
//   node scripts/seedSubjects.mjs
//
// Safe to re-run: uses merge writes, never resets seats already claimed.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const BADGE_SEATS_PER_SUBJECT = 2;

const { SUBJECTS } = await import('../src/lib/subjects.js');

async function seed() {
  const batchSize = 400;
  let batch = db.batch();
  let count = 0;

  for (const subject of SUBJECTS) {
    const ref = db.collection('subjects').doc(subject.id);
    batch.set(
      ref,
      {
        name: subject.name,
        category: subject.category,
        badgeSeatsMax: BADGE_SEATS_PER_SUBJECT,
        badgeSeatsFilled: 0,
      },
      { mergeFields: ['name', 'category', 'badgeSeatsMax'] }
    );
    count += 1;
    if (count % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();

  const snapshot = await db.collection('subjects').get();
  const fixBatch = db.batch();
  snapshot.forEach((doc) => {
    if (doc.data().badgeSeatsFilled === undefined) {
      fixBatch.set(doc.ref, { badgeSeatsFilled: 0 }, { merge: true });
    }
  });
  await fixBatch.commit();

  console.log(`Seeded/updated ${count} subjects in Firestore.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});