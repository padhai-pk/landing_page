// Role-based share captions + platform composer URLs for Padhai.pk cards.
// Caption text is loaded from /share-captions.json (editable without code changes).

import { DEFAULT_SHARE_CAPTIONS } from './defaultShareCaptions.js';

let captionsCache = null;
let captionsCacheAt = 0;
let captionsPromise = null;
const CAPTIONS_CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/** Load share-captions.json with a 1-hour in-memory cache (always revalidates after expiry). */
export function loadShareCaptions() {
  if (captionsCache && (Date.now() - captionsCacheAt) < CAPTIONS_CACHE_MAX_AGE_MS) {
    return Promise.resolve(captionsCache);
  }
  captionsCache = null;

  if (!captionsPromise) {
    captionsPromise = fetch('/share-captions.json', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('share-captions.json not found'))))
      .then((data) => {
        captionsCache = deepMergeCaptions(DEFAULT_SHARE_CAPTIONS, data);
        captionsCacheAt = Date.now();
        return captionsCache;
      })
      .catch(() => {
        captionsCache = DEFAULT_SHARE_CAPTIONS;
        captionsCacheAt = Date.now();
        return captionsCache;
      })
      .finally(() => {
        captionsPromise = null;
      });
  }
  return captionsPromise;
}

function deepMergeCaptions(base, patch) {
  return {
    ...base,
    ...patch,
    socialHandles: { ...base.socialHandles, ...patch.socialHandles },
    blocks: { ...base.blocks, ...patch.blocks },
    templates: { ...base.templates, ...patch.templates },
    shareMessages: { ...base.shareMessages, ...patch.shareMessages },
    websiteLabel: patch.websiteLabel ?? base.websiteLabel,
  };
}

function formatDisplayName(name) {
  const words = (name || 'I').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'I';
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function fill(template, vars) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

/** Build a ready-to-post caption using templates from share-captions.json. */
export function buildShareCaption(
  { role, name, subjects = [], waitlistId = '' },
  config = DEFAULT_SHARE_CAPTIONS,
) {
  const blocks = config.blocks || DEFAULT_SHARE_CAPTIONS.blocks;
  const handles = config.socialHandles || DEFAULT_SHARE_CAPTIONS.socialHandles;
  const siteUrl = config.siteUrl || DEFAULT_SHARE_CAPTIONS.siteUrl;
  const websiteLabel = config.websiteLabel || DEFAULT_SHARE_CAPTIONS.websiteLabel || 'www.Padhai.pk';

  const subjectList = subjects.filter(Boolean).slice(0, 3);
  const subjectsBlock = subjectList.length
    ? fill(blocks.subjectsLine, { subjects: subjectList.join(' · ') })
    : '';
  const waitlistBlock = waitlistId
    ? fill(blocks.waitlistIdLine, { waitlistId })
    : '';

  const displayName = formatDisplayName(name);

  const vars = {
    firstName: displayName,
    fullName: displayName,
    subjects: subjectsBlock,
    waitlistId: waitlistBlock,
    siteUrl,
    websiteLabel,
    instagram: handles.instagram,
    facebook: handles.facebook,
    linkedin: handles.linkedin,
  };

  const roleTemplate = config.templates?.[role] || config.templates?.default || DEFAULT_SHARE_CAPTIONS.templates.default;

  return (
    fill(roleTemplate.headline, vars) +
    fill(roleTemplate.body, vars) +
    fill(blocks.tagline, vars) +
    fill(blocks.handles, vars) +
    fill(blocks.cta, vars)
  );
}

async function copyCaption(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadBlob(blob, filename = 'padhai-pk-card.png') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function siteUrlFromConfig(config) {
  return config?.siteUrl || DEFAULT_SHARE_CAPTIONS.siteUrl;
}

function msg(config, key, fallback) {
  return config?.shareMessages?.[key] || DEFAULT_SHARE_CAPTIONS.shareMessages[key] || fallback;
}

/** Try the OS share sheet with image + caption (best on mobile → IG/FB stories & posts). */
export async function tryNativeShare(blob, caption, config = DEFAULT_SHARE_CAPTIONS) {
  const siteUrl = siteUrlFromConfig(config);
  const file = new File([blob], 'padhai-pk-card.png', { type: 'image/png' });
  if (!navigator.share) return false;
  if (navigator.canShare && !navigator.canShare({ files: [file], text: caption })) {
    if (!navigator.canShare({ text: caption })) return false;
    try {
      await navigator.share({ title: 'Padhai.pk', text: caption, url: siteUrl });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.share({
      files: [file],
      title: 'Padhai.pk',
      text: caption,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Open the native composer for each platform directly (no OS share sheet).
 * Downloads the card and copies the caption so the user can attach/paste in-app.
 */
export async function openPlatformShare(platform, { blob, caption, social = {}, config = DEFAULT_SHARE_CAPTIONS }) {
  const siteUrl = siteUrlFromConfig(config);
  const encodedCaption = encodeURIComponent(caption);
  const encodedUrl = encodeURIComponent(siteUrl);
  const copied = await copyCaption(caption);

  downloadBlob(blob);

  switch (platform) {
    case 'linkedin': {
      const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedCaption}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return {
        copied,
        opened: true,
        method: 'linkedin',
        message: copied
          ? msg(config, 'linkedinCopied', 'Caption copied & LinkedIn post opened.')
          : msg(config, 'linkedinOpened', 'LinkedIn post opened with your caption.'),
      };
    }

    case 'facebook': {
      if (isMobile()) {
        window.location.href = 'fb://composer';
      } else {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`;
        window.open(url, '_blank', 'noopener,noreferrer,width=600,height=720');
      }
      return {
        copied,
        opened: true,
        method: 'facebook',
        message: copied
          ? msg(config, 'facebookCopied', 'Caption copied & Facebook composer opened.')
          : msg(config, 'facebookOpened', 'Facebook composer opened.'),
      };
    }

    case 'instagram': {
      if (isMobile()) {
        window.location.href = 'instagram-stories://share';
        window.setTimeout(() => {
          window.location.href = 'instagram://story-camera';
        }, 400);
      } else {
        const igUrl = social.instagram || 'https://www.instagram.com/padhai.pk/';
        window.open(igUrl, '_blank', 'noopener,noreferrer');
      }
      return {
        copied,
        opened: true,
        method: 'instagram',
        message: copied
          ? msg(config, 'instagramCopied', 'Card saved & caption copied! Instagram Stories is opening — attach your card and paste the caption.')
          : msg(config, 'instagramOpened', 'Card saved! Instagram Stories is opening — attach your card and tag @padhai.pk.'),
      };
    }

    default:
      return { copied, opened: false, method: 'none', message: 'Sharing is not available on this platform.' };
  }
}
