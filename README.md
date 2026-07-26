# Padhai.pk — Pre-Launch Waitlist Landing Page

A React (Vite) landing page for Padhai.pk's pre-launch, connected to Firebase
Firestore for live data: total students/teachers on the waitlist, subjects
covered, and — the centerpiece — a **per-subject "Verified Badge" seat
tracker** that only allows the first 2 teachers per subject to claim a free
Rs. 3,000 verification badge, with everyone after that automatically emailed
and routed to the general waitlist.

## What's new in this version

- **Dark mode by default**, with a light-mode toggle in the navbar. Theme is
  set inline in `index.html` before React mounts (no flash-of-wrong-theme)
  and persisted in `localStorage`.
- **Outlined icons throughout** via `lucide-react` — no emoji anywhere.
- **Scroll and entrance animations**: staggered fade-ins on every section
  (`components/Reveal.jsx`, IntersectionObserver-based, respects
  `prefers-reduced-motion`), an animated hero entrance, live count-up numbers
  in the stats strip, hover micro-interactions on cards/buttons, and a
  back-to-top button.
- **Copy rewritten for a global audience** — no Urdu script (the brand name
  is plain "Padhai.pk"), no "Karachi/Lahore/Islamabad only" framing. The
  hero tagline is now *"Padhna ho ya Padhana, sirf Padhai.pk pr aana."*
- **67 subjects**, fully driven by Firestore (`lib/subjects.js` is the
  fallback/seed list only — see "Managing subjects" below) with a searchable
  multi-select picker in the waitlist form and a search + category filter
  on the seat-tracker grid.
- **Nielsen's 10 usability heuristics**, applied concretely:
  1. *Visibility of system status* — live seat counts, submit-button
     loading spinner, real-time stats.
  2. *Match with the real world* — plain-language copy, the roll-number-slip
     metaphor for seats.
  3. *User control & freedom* — theme toggle, dismissible toast, closable
     mobile menu, back-to-top.
  4. *Consistency & standards* — one button/spacing/icon system site-wide.
  5. *Error prevention* — full subjects are disabled (not selectable) rather
     than allowed and rejected; required fields marked; email format checked.
  6. *Recognition over recall* — search + category filters instead of
     scrolling 67 checkboxes.
  7. *Flexibility & efficiency* — searchable subject picker, keyboard-
     operable controls.
  8. *Aesthetic & minimalist design* — one signature visual motif (the
     seat slips), animation used to support content, not distract from it.
  9. *Help users recover from errors* — inline, field-specific error text.
  10. *Help & documentation* — the FAQ section.

## What's inside

- **Hero, problem, how-it-works, features** sections telling the Padhai.pk
  story and MVP scope (marketplace, proposals, boosts, subscriptions, Jitsi
  sessions, escrow, connected payouts, JazzCash/EasyPaisa/card).
- **Teacher Seat Program** — the signature section: subject cards styled like
  Pakistani exam roll-number slips, each with exactly 2 seats that fill in
  live as teachers claim them.
- **Waitlist form** — three tabs (Student / Teacher / Badge seat) writing
  straight to Firestore, with real-time subject dropdown that disables
  subjects once both seats are full.
- **Live stats strip** — students waiting, teachers waiting, subjects
  covered, badge seats claimed — all streamed from Firestore in real time.

## 1. Firebase setup

1. Go to the [Firebase Console](https://console.firebase.google.com), create
   a project (or use an existing one).
2. **Build → Firestore Database → Create database** (start in production
   mode — the rules below lock it down correctly).
3. **Project settings → General → Your apps → Add app → Web**, copy the
   config values into a `.env` file (copy `.env.example` → `.env` and fill
   it in):

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

4. Deploy the security rules in `firestore.rules` (Console → Firestore →
   Rules tab → paste and publish, or `firebase deploy --only firestore:rules`
   if you use the Firebase CLI).

5. **Seed the subjects collection before launch.** Unlike the previous
   version of this app, subject documents are no longer auto-created —
   with 67 subjects, that could otherwise leave the "seats" grid partially
   populated. Run the one-time seed script instead:

   ```bash
   npm i -D firebase-admin
   # Firebase Console → Project settings → Service accounts →
   #   Generate new private key → save as scripts/serviceAccountKey.json
   node scripts/seedSubjects.mjs
   ```

   This pushes every subject in `src/lib/subjects.js` into Firestore. It's
   safe to re-run — it never resets seats that have already been claimed.

   **After seeding, manage subjects directly in the Firebase Console**
   (Firestore → `subjects` collection): add a document to add a subject,
   delete one to remove it, no code changes or redeploys required. Until
   subjects are seeded, the page falls back to showing the static list from
   `src/lib/subjects.js` with all seats open, so local development still
   works without Firestore configured.

6. **Email notifications** ("this subject already has 2 teachers") — see
   `functions/README.md` for the 5-minute no-code setup using the official
   Firebase "Trigger Email" extension.

## 2. Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## 3. Build & deploy

```bash
npm run build
```

Outputs static files to `dist/`. Deploy anywhere that serves static sites —
Firebase Hosting is the natural fit since you're already using Firestore:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # point it at the `dist` folder, configure as a SPA
firebase deploy
```

## Project structure

```
src/
  firebase.js              Firebase app + Firestore init
  lib/
    subjects.js             The editable list of subjects + seat count (2/subject)
    waitlist.js              All Firestore reads/writes (transactions, listeners)
  components/
    Navbar, Hero, StatsStrip, ProblemSection, HowItWorks,
    FeaturesGrid, SeatProgram, WaitlistSection, Toast, Footer
firestore.rules             Security rules to deploy alongside this schema
functions/README.md         How to wire up the "subject full" email
```

## Firestore schema reference

| Collection | Purpose |
|---|---|
| `subjects/{subjectId}` | `{ name, category, badgeSeatsFilled, badgeSeatsMax }` — live seat count per subject |
| `waitlistStudents/{id}` | Student signups |
| `waitlistTeachersNormal/{id}` | Teachers on the plain waitlist |
| `waitlistTeachersBadge/{id}` | Badge-seat applications, `status: 'seat_reserved' \| 'subject_full'` |
| `stats/global` | `{ studentsCount, teachersNormalCount, teachersBadgeCount }` |
| `mail/{id}` | Queued for the Trigger Email extension when a subject is full |

## Design system

Colors, type, spacing, radii, and button/card styles all follow the Padhai
Edu design tokens (`--blue #142a49`, `--green #1d8877`, `--light-green
#12d16f`, Poppins body / Space Grotesk display) — see `src/index.css` for the
full token set.
