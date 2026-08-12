// Fallback if /share-captions.json fails to load — keep in sync with public/share-captions.json.

export const DEFAULT_SHARE_CAPTIONS = {
  siteUrl: 'https://www.padhai.pk',
  websiteLabel: 'www.Padhai.pk',
  socialHandles: {
    instagram: '@padhai.pk',
    facebook: 'Padhai.pk',
    linkedin: 'Padhai.pk',
  },
  blocks: {
    tagline: '\n\nPadhna ho ya Padhana, sirf Padhai.pk pr aana! 🎓',
    cta: '\n\n👉 Join the waitlist at {websiteLabel}\n{siteUrl}',
    handles: '\n\nFollow {instagram} on Instagram · {facebook} on Facebook · {linkedin} on LinkedIn',
    subjectsLine: '\n📚 {subjects}',
    waitlistIdLine: '\n🆔 {waitlistId}',
  },
  templates: {
    student: {
      headline: '🎓 {fullName} is on the Padhai.pk VIP Student waitlist!{subjects}{waitlistId}',
      body: '\n\nEarly access, a free 1-month Profile Boost, and learning credits at launch.',
    },
    teacher: {
      headline: '👨‍🏫 {fullName} is a VIP Teacher on the Padhai.pk waitlist!{subjects}{waitlistId}',
      body: '\n\nHelping Pakistan learn smarter — teachers & students, one platform.',
    },
    badge: {
      headline: '✅ {fullName} applied for the Padhai.pk Verified Badge!{subjects}{waitlistId}',
      body: "\n\nAmong the first verified educators on Pakistan's new learning platform.",
    },
    default: {
      headline: '{fullName} joined the Padhai.pk waitlist!{subjects}{waitlistId}',
      body: "\n\nBe among the first on Pakistan's new learning platform.",
    },
  },
  shareMessages: {
    nativeSuccess: 'Share sheet opened with your card and caption — pick an app and tap Post.',
    nativeUnsupported: "Native sharing isn't supported on this browser — use Facebook, Instagram, or LinkedIn below.",
    linkedinCopied: 'Caption copied & LinkedIn post opened — attach the downloaded card image, then click Post.',
    linkedinOpened: 'LinkedIn post opened with your caption — attach the downloaded card image, then click Post.',
    facebookCopied: 'Caption copied & Facebook composer opened — attach the downloaded card, paste caption if needed, tag Padhai.pk, then Post.',
    facebookOpened: 'Facebook composer opened — attach the downloaded card, tag Padhai.pk, then Post.',
    instagramCopied: 'Caption copied! In Instagram, create a new post or story, attach the downloaded card, paste the caption, tag @padhai.pk, then share.',
    instagramOpened: 'Card downloaded! In Instagram, create a new post or story, attach the card, tag @padhai.pk, then share.',
    platformNative: 'Share sheet opened with your card and caption — pick Instagram, Facebook, or LinkedIn and tap Post.',
  },
};
