# Email notifications ("subject already has teachers")

The app never calls a Cloud Function directly. Instead, when a teacher applies
for a Verified Badge seat on a subject that's already full, the client writes
a document to a `mail` collection in Firestore (see `src/lib/waitlist.js`,
`joinTeacherBadgeWaitlist`).

The simplest way to actually deliver that email — no custom backend code to
write or deploy — is the official Firebase Extension:

**"Trigger Email" by Firebase (firestore-send-email)**

## Setup (one-time, from the Firebase Console)

1. Firebase Console → your project → Extensions → search "Trigger Email" → Install.
2. Configure it with:
   - **Collection path:** `mail`
   - **SMTP connection URI:** your SMTP provider (SendGrid, Mailgun, Gmail
     with an app password, etc.) — e.g. `smtps://apikey:YOUR_SENDGRID_KEY@smtp.sendgrid.net:465`
   - **Default FROM address:** e.g. `Padhai.pk <hello@padhai.pk>`
3. Done. Any document written to `mail` with the shape:
   ```json
   { "to": ["someone@example.com"], "message": { "subject": "...", "text": "..." } }
   ```
   is automatically emailed by the extension, and the extension writes back
   a `delivery` status field onto the document you can audit later.

## If you'd rather run your own Cloud Function instead

A minimal equivalent, deployed with `firebase deploy --only functions`:

```js
// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 465,
  secure: true,
  auth: { user: 'apikey', pass: functions.config().sendgrid.key },
});

exports.sendWaitlistMail = functions.firestore
  .document('mail/{docId}')
  .onCreate(async (snap) => {
    const { to, message } = snap.data();
    await transporter.sendMail({
      from: 'Padhai.pk <hello@padhai.pk>',
      to,
      subject: message.subject,
      text: message.text,
    });
  });
```

Either approach works with the exact `mail` collection writes already in
`src/lib/waitlist.js` — no frontend changes needed.
