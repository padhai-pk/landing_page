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
  sharePage: {
    boostTitle: "What's included in your free Profile Boost?",
    teacherBoostIntro: 'Teachers with an active boost get seen first when students search:',
    teacherBoostPoints: [
      'Your profile appears at the top of search results — above non-boosted teachers.',
      'More visibility means more proposals and demo requests from students who need your subject.',
    ],
    studentBoostIntro: 'Students with an active boost get more responses on their posts:',
    studentBoostPoints: [
      'You receive Post Boost credits so your learning requirement posts appear above other posts.',
      'More teachers see your request first, so you get faster proposals on the subjects you need.',
    ],
    privateProfileTitle: 'Have a private profile?',
    privateProfileBody: 'If your Instagram or Facebook account is private, you can still share your card as a post or story (visible to your followers), mention @padhai.pk, then upload a screenshot below. Our team will verify it and apply your free 1-month boost.',
    privateProfileRulesTitle: 'Screenshot rules — please read before uploading',
    privateProfileRules: [
      "Don't share from demo or brand-new accounts with only 5-10 followers.",
      "Don't share only to Close Friends or a restricted story list our team can't verify.",
      'Upload your screenshot at least 6 hours after posting — not immediately.',
      "Don't delete the post after taking the screenshot; it must still be live when we review.",
      "Don't crop out @padhai.pk, your waitlist ID, or the post timestamp from the screenshot.",
      "Don't submit fake, edited, or reused screenshots — one boost per waitlist entry.",
      'Make sure the username you enter below exactly matches the account that posted.',
      'Don\'t post without your Post card Image.',
      'Don\'t Forget to Mention @padhai.pk in your post.',
      'For getting this page after some time you can get this page from your email of the waitlist.'
    ],
    socialUsernameLabel: 'Username of the account that posted',
    socialUsernamePlaceholder: 'e.g. @yourusername',
    socialUsernameRequired: 'Enter the username of the account where you posted before uploading.',
    screenshotFileLabel: 'Screenshot of your post or story',
    screenshotFileHint: 'JPG or PNG, max 3MB. Take it at least 6 hours after posting.',
    screenshotFileRequired: 'Choose a screenshot of your post before submitting.',
    uploadScreenshot: 'Submit screenshot for review',
    whatsappCommunityIntro: 'While you wait for launch, join our WhatsApp community for updates, tips, and early announcements.',
    uploadingScreenshot: 'Uploading…',
    uploadSuccess: 'Screenshot received! Our team will verify your post and apply your free Profile Boost.',
    platforms: {
      facebook: 'Post on Facebook',
      instagram: 'Share story on Instagram',
      linkedin: 'Post on LinkedIn',
    },
    shareButton: 'Share',
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
