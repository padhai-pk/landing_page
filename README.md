# Padhai.pk — Pre-Launch Waitlist Site

A React (Vite) + Firebase landing site for Padhai.pk's pre-launch: a live
teacher/student waitlist, a per-subject "Verified Badge" seat tracker, and
a full badge-application page with document upload to Google Drive.

## What's in this version

- **Light theme by default**, dark mode available via the navbar toggle.
  Set inline in `index.html` before React mounts (no flash of the wrong
  theme) and persisted in `localStorage`.
- **Your logo** in the header and footer — drop your file in
  `public/logo.svg` (or update `logo.src` in `public/content.json` to point
  at a different filename/format).
- **Scroll animations everywhere** — every section fades/slides up as it
  enters the viewport (`src/components/Reveal.jsx`, IntersectionObserver-
  based, respects `prefers-reduced-motion`), plus a staggered hero entrance
  and animated count-up stats.
- **Floating outlined background icons** — low-opacity, slowly floating
  lucide icons (book, lightbulb, graduation cap, shield, etc.) along the
  edges of each section, never overlapping content, hidden on small screens
  (`src/components/FloatingIcons.jsx`).
- **All site copy lives in `public/content.json`** — tagline, nav labels,
  hero text, problem cards, how-it-works steps, features, FAQs, footer
  copy, badge program policies, and demo stats. Edit that one file and
  redeploy — no component code changes needed. `src/lib/defaultContent.js`
  is an offline fallback used only if the fetch fails.
- **Two waitlist tabs** (Student / Teacher) instead of three — the badge
  program now lives inside the Teacher tab as a promo card linking to a
  **dedicated `/badge-application` page** with the full teacher profile
  form, document uploads, and policy acceptance.
- **Documents upload to Google Drive**, not Firebase Storage — see
  "Google Drive setup" below.
- **Subjects fetched live from Firestore**, with only the **top 10
  subjects that still have an open badge seat** rendered in a horizontal-
  scroll strip (not all 60+) so the page stays fast regardless of how many
  subjects exist.
- Fixed: equal-height cards in the features grid and the seat strip,
  stronger nav-link and hero-button contrast, hamburger menu hidden on
  desktop, wider gap between icon and text in the problem cards.

## 1. Firebase setup

1. [Firebase Console](https://console.firebase.google.com) → create/select
   a project → **Build → Firestore Database → Create database** (production
   mode).
2. **Project settings → General → Your apps → Add app → Web** → copy the
   config into `.env` (copy `.env.example` → `.env` first):
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. Deploy `firestore.rules` (Console → Firestore → Rules tab → paste →
   Publish).
4. **Seed subjects before launch:**
   ```bash
   npm i -D firebase-admin
   # Firebase Console → Project settings → Service accounts →
   #   Generate new private key → save as scripts/serviceAccountKey.json
   node scripts/seedSubjects.mjs
   ```
   After seeding, add/remove subjects straight from the Firestore console,
   or use the Python admin app in `/admin-app` (comma-separated bulk add
   with automatic duplicate skipping).
5. (Optional) Email notifications when a subject is full — see
   `functions/README.md` for the no-code Firebase "Trigger Email" extension
   setup, consuming the `mail` collection this app already writes to.

### Firestore schema

| Collection | Purpose |
|---|---|
| `subjects/{subjectId}` | `{ name, category, badgeSeatsFilled, badgeSeatsMax }` |
| `waitlistStudents/{id}` | Student signups |
| `waitlistTeachersNormal/{id}` | Teachers on the plain waitlist |
| `waitlistTeachersBadge/{id}` | Full badge applications — profile fields, `documents: { cnicFront, cnicBack, qualificationCert }` (Drive links), `policiesAccepted`, `status: 'seat_reserved' \| 'subject_full'` |
| `stats/global` | `{ studentsCount, teachersNormalCount, teachersBadgeCount }` |
| `mail/{id}` | Queued for the Trigger Email extension |

## 2. Google Drive setup (verification documents)

Badge applicants upload CNIC + qualification documents on `/badge-application`.
These go to a Vercel serverless function (`api/upload-to-drive.js`) which
uploads them into a shared Drive folder using a service account — no
per-teacher Google login required.

1. Google Cloud Console → enable the **Google Drive API** on your project.
2. **IAM & Admin → Service Accounts → Create service account → Create key
   (JSON)** → download it.
3. Create a Google Drive folder for verification documents → **Share** it
   with the service account's email (the `client_email` in the JSON key) →
   give it **Editor** access.
4. Add these environment variables (Vercel → Project → Settings →
   Environment Variables — **not** prefixed with `VITE_`, these are
   server-only):
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL   = client_email from the JSON key
   GOOGLE_SERVICE_ACCOUNT_KEY     = private_key from the JSON key
   GOOGLE_DRIVE_FOLDER_ID         = the folder's ID (from its URL)
   ```
5. Redeploy.

## 3. Run locally

```bash
npm install
npm run dev
```

## 4. Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel            # first deploy
vercel --prod     # production deploy
```

Add the `VITE_FIREBASE_*` variables (Production, Preview, Development) and
the three `GOOGLE_*` variables above in the Vercel dashboard, then redeploy.
`vercel.json` is already configured to serve the SPA correctly while still
routing `/api/*` to the serverless function (not swallowed by the SPA
fallback).

Also add your Vercel domain to Firebase Console → Authentication →
Settings → **Authorized domains**.

## 5. Admin desktop app

`/admin-app` is a standalone Python (Tkinter) tool for the team — see
`admin-app/README.md`. It shows live signup counts + last-submission time,
lets you bulk-add subjects (comma-separated, duplicate-safe), and exports
each collection to `.xlsx`.

## Project structure

```
src/
  App.jsx                   Providers + routing (/ and /badge-application)
  firebase.js                Firebase app + Firestore init
  lib/
    content.jsx               Runtime content provider (fetches /content.json)
    defaultContent.js          Offline fallback copy of content.json
    icons.js                   Icon-name → lucide component lookup
    subjects.js                Fallback/seed subject list (67 subjects)
    theme.jsx                  Light/dark theme context
    waitlist.js                All Firestore reads/writes
    driveUpload.js              Client helper for /api/upload-to-drive
  hooks/useCountUp.js          Animated number count-up
  components/                  Navbar, Hero, StatsStrip, ProblemSection,
                                HowItWorks, FeaturesGrid, SeatProgram,
                                WaitlistSection, SubjectPicker, FAQSection,
                                FloatingIcons, Reveal, Toast, BackToTop, Footer
  pages/
    LandingPage.jsx             The full "/" page
    BadgeApplicationPage.jsx    The full "/badge-application" page + form
api/
  upload-to-drive.js          Vercel serverless function → Google Drive
public/
  content.json                 All editable site copy
  logo.svg                     Placeholder — replace with your real logo
scripts/seedSubjects.mjs       One-time Firestore subject seeding
admin-app/                     Python desktop admin tool (separate from the site)
firestore.rules                Security rules to deploy
vercel.json / .vercelignore    Vercel deployment config
```
