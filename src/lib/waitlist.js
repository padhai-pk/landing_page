// src/lib/waitlist.js
// All Firestore reads/writes for the Padhai.pk waitlist live here.
//
// FIRESTORE COLLECTIONS USED
// ─────────────────────────────────────────────────────────────────────
// subjects/{subjectId}          { name, category, badgeSeatsFilled, badgeSeatsMax }
// waitlistStudents/{autoId}     student signups
// waitlistTeachersNormal/{id}   teachers on the plain "join as teacher" waitlist
// waitlistTeachersBadge/{id}    teachers applying for a free Verified Badge seat
//                                status: 'seat_reserved' | 'subject_full'
// stats/global                  { studentsCount, teachersNormalCount, teachersBadgeCount }
// mail/{autoId}                 consumed by the Firebase "Trigger Email" extension
//                                to notify a teacher their subject is full
//
// See /firestore.rules for the security rules to deploy with this schema,
// and /functions/README.md for the optional email-notification setup.

import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  increment,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SUBJECTS, BADGE_SEATS_PER_SUBJECT } from './subjects';

/* ---------------------------------------------------------------------- */
/*  Live listeners (power the "seats" UI and the stats strip)             */
/* ---------------------------------------------------------------------- */

// Streams the LIVE subject list from Firestore — this is the source of
// truth so the team can add/remove subjects from the Firebase console (or
// the seed script) without a code deploy. If Firestore has no subjects yet
// (fresh project, still offline, rules not deployed), falls back to the
// local SUBJECTS list from lib/subjects.js so the page still works.
export function listenToSubjects(callback) {
  const unsub = onSnapshot(
    query(collection(db, 'subjects'), orderBy('name')),
    (snap) => {
      if (snap.empty) {
        callback(SUBJECTS.map((s) => ({ ...s, badgeSeatsFilled: 0, badgeSeatsMax: BADGE_SEATS_PER_SUBJECT })));
        return;
      }
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          category: data.category,
          badgeSeatsFilled: data.badgeSeatsFilled ?? 0,
          badgeSeatsMax: data.badgeSeatsMax ?? BADGE_SEATS_PER_SUBJECT,
        };
      });
      callback(list);
    },
    () => {
      // Offline / not configured yet — show static list so the UI still works.
      callback(SUBJECTS.map((s) => ({ ...s, badgeSeatsFilled: 0, badgeSeatsMax: BADGE_SEATS_PER_SUBJECT })));
    }
  );

  return unsub;
}

// Streams the global counters shown in the stats strip.
export function listenToStats(callback) {
  const ref = doc(db, 'stats', 'global');
  return onSnapshot(
    ref,
    (snap) => {
      const d = snap.data() || {};
      callback({
        studentsCount: d.studentsCount ?? 0,
        teachersNormalCount: d.teachersNormalCount ?? 0,
        teachersBadgeCount: d.teachersBadgeCount ?? 0,
      });
    },
    () => callback({ studentsCount: 0, teachersNormalCount: 0, teachersBadgeCount: 0 })
  );
}

/* ---------------------------------------------------------------------- */
/*  Writes                                                                 */
/* ---------------------------------------------------------------------- */

export async function joinStudentWaitlist(formData) {
  await addDoc(collection(db, 'waitlistStudents'), {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    city: formData.city,
    country: formData.country || '',
    subjectsInterested: formData.subjects || [],
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, 'stats', 'global'),
    { studentsCount: increment(1) },
    { merge: true }
  );
}

export async function joinTeacherNormalWaitlist(formData) {
  await addDoc(collection(db, 'waitlistTeachersNormal'), {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    city: formData.city,
    country: formData.country || '',
    subjects: formData.subjects || [],
    experience: formData.experience || '',
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, 'stats', 'global'),
    { teachersNormalCount: increment(1) },
    { merge: true }
  );
}

// Applies for a free Verified Badge seat (worth Rs. 3,000) for ONE subject.
// Uses a transaction so two simultaneous submissions can never both win the
// same seat. Returns { status: 'seat_reserved' | 'subject_full' }.
// Applies for free Verified Badge seats across MULTIPLE subjects (max 10)
// in a single atomic transaction — each subject is claimed independently,
// so a teacher can get "seat_reserved" on some and "subject_full" on
// others within the same application.
export async function joinTeacherBadgeWaitlist(formData) {
  const subjectIds = (formData.subjectIds || []).slice(0, 10);
  if (subjectIds.length === 0) {
    throw new Error('Select at least one subject.');
  }

  const applicationRef = doc(collection(db, 'waitlistTeachersBadge'));
  const statsRef = doc(db, 'stats', 'global');

  const results = await runTransaction(db, async (tx) => {
    // Firestore transactions require ALL reads before ANY writes.
    const subjectRefs = subjectIds.map((id) => doc(db, 'subjects', id));
    const subjectSnaps = await Promise.all(subjectRefs.map((ref) => tx.get(ref)));

    const perSubject = subjectSnaps.map((snap, i) => {
      if (!snap.exists()) {
        throw new Error(
          `Subject "${subjectIds[i]}" isn't set up in Firestore yet. Run the seed script (see README) before accepting badge applications.`
        );
      }
      const data = snap.data();
      const filled = data.badgeSeatsFilled ?? 0;
      const max = data.badgeSeatsMax ?? BADGE_SEATS_PER_SUBJECT;
      const seatAvailable = filled < max;
      return { ref: subjectRefs[i], id: subjectIds[i], name: data.name, filled, max, seatAvailable };
    });

    perSubject.forEach((s) => {
      tx.set(
        s.ref,
        { badgeSeatsFilled: s.seatAvailable ? s.filled + 1 : s.filled },
        { merge: true }
      );
    });

    const subjectResults = perSubject.map((s) => ({
      subjectId: s.id,
      subjectName: s.name,
      status: s.seatAvailable ? 'seat_reserved' : 'subject_full',
    }));

    tx.set(applicationRef, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      country: formData.country || '',
      cnicNumber: formData.cnicNumber || '',
      subjectResults,
      qualification: formData.qualification || '',
      institution: formData.institution || '',
      experience: formData.experience || '',
      bio: formData.bio || '',
      introVideoLink: formData.introVideoLink || '',
      documents: {
        cnicFront: formData.documents?.cnicFront || null,
        cnicBack: formData.documents?.cnicBack || null,
        qualificationCert: formData.documents?.qualificationCert || null,
      },
      policiesAccepted: formData.policiesAccepted || false,
      createdAt: serverTimestamp(),
    });

    tx.set(statsRef, { teachersBadgeCount: increment(1) }, { merge: true });

    return subjectResults;
  });

  // Email any subjects that were already full when this application landed.
  const fullOnes = results.filter((r) => r.status === 'subject_full');
  if (fullOnes.length > 0) {
    await addDoc(collection(db, 'mail'), {
      to: [formData.email],
      message: {
        subject: `Padhai.pk — some subjects you applied for already have 2 verified teachers`,
        text:
          `Hi ${formData.name},\n\n` +
          `Thanks for applying for free Verified Badge seats. Here's how each subject went:\n\n` +
          results.map((r) => `- ${r.subjectName}: ${r.status === 'seat_reserved' ? 'Seat reserved!' : 'Already full — added to general waitlist'}`).join('\n') +
          `\n\n— Team Padhai.pk`,
      },
      createdAt: serverTimestamp(),
    });
  }

  return { results };
}
