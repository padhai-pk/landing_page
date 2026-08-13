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

export function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function siteUrlFromConfig(config) {
  return config?.siteUrl || DEFAULT_SHARE_CAPTIONS.siteUrl;
}

function msg(config, key, fallback) {
  return config?.shareMessages?.[key] || DEFAULT_SHARE_CAPTIONS.shareMessages[key] || fallback;
}

function navigateTo(url, popup) {
  if (popup && !popup.closed) {
    popup.location.replace(url);
    return 'popup';
  }
  if (isMobile()) {
    window.location.assign(url);
    return 'same-window';
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return 'new-window';
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read image'));
        return;
      }
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Compress large PNG cards so Instagram story deep links stay within URL limits. */
async function compressForStoryShare(blob) {
  if (blob.size <= 900_000) return blob;
  try {
    const bitmap = await createImageBitmap(blob);
    const maxWidth = 1080;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const jpeg = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    return jpeg || blob;
  } catch {
    return blob;
  }
}

function openLinkedInComposer(caption, popup) {
  const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption)}`;
  navigateTo(url, popup);
  return { method: 'linkedin', attachedImage: false };
}

function openFacebookComposer(caption, siteUrl, popup) {
  const encodedCaption = encodeURIComponent(caption);
  const encodedUrl = encodeURIComponent(siteUrl);

  if (isIOS()) {
    window.location.assign('fb://publish');
    return { method: 'facebook-ios', attachedImage: false };
  }

  if (isAndroid()) {
    window.location.assign(
      `intent://composer/?text=${encodedCaption}#Intent;package=com.facebook.katana;scheme=fb;end`,
    );
    return { method: 'facebook-android', attachedImage: false };
  }

  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`;
  navigateTo(url, popup);
  return { method: 'facebook-web', attachedImage: false };
}

async function openInstagramStory(blob, popup) {
  const storyBlob = await compressForStoryShare(blob);

  if (isIOS()) {
    try {
      const base64 = await blobToBase64(storyBlob);
      window.location.assign(
        `instagram-stories://share?backgroundImage=${encodeURIComponent(base64)}`,
      );
      return { method: 'instagram-story-ios', attachedImage: true };
    } catch {
      window.location.assign('instagram://story-camera');
      return { method: 'instagram-story-ios-fallback', attachedImage: false };
    }
  }

  if (isAndroid()) {
    try {
      const base64 = await blobToBase64(storyBlob);
      window.location.assign(
        `intent://share/#Intent;package=com.instagram.android;scheme=instagram-stories;type=image/*;S.background_image=${encodeURIComponent(base64)};end`,
      );
      return { method: 'instagram-story-android', attachedImage: true };
    } catch {
      window.location.assign(
        'intent://story-camera/#Intent;package=com.instagram.android;scheme=instagram;end',
      );
      return { method: 'instagram-story-android-fallback', attachedImage: false };
    }
  }

  navigateTo('https://www.instagram.com/', popup);
  return { method: 'instagram-web', attachedImage: false };
}

function scheduleCaptionAndDownload(caption, blob, skipDownload) {
  window.setTimeout(async () => {
    await copyCaption(caption);
    if (!skipDownload) downloadBlob(blob);
  }, 600);
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
 * Open each platform's post/story composer directly (no OS share sheet).
 * Opens the composer first, then copies the caption and downloads the card if needed.
 */
export async function openPlatformShare(platform, {
  blob,
  caption,
  config = DEFAULT_SHARE_CAPTIONS,
  popup = null,
}) {
  const siteUrl = siteUrlFromConfig(config);
  let openResult;

  try {
    switch (platform) {
      case 'linkedin':
        openResult = openLinkedInComposer(caption, popup);
        break;
      case 'facebook':
        openResult = openFacebookComposer(caption, siteUrl, popup);
        break;
      case 'instagram':
        openResult = await openInstagramStory(blob, popup);
        break;
      default:
        popup?.close();
        return { copied: false, opened: false, method: 'none', message: 'Sharing is not available on this platform.' };
    }
  } catch {
    popup?.close();
    return { copied: false, opened: false, method: 'error', message: 'Could not open the app. Try Share now or download the card.' };
  }

  scheduleCaptionAndDownload(caption, blob, openResult.attachedImage);

  switch (platform) {
    case 'linkedin':
      return {
        copied: true,
        opened: true,
        method: openResult.method,
        message: msg(
          config,
          'linkedinCopied',
          'LinkedIn post composer opened with your caption — attach the card if it is not already there.',
        ),
      };
    case 'facebook':
      return {
        copied: true,
        opened: true,
        method: openResult.method,
        message: msg(
          config,
          'facebookCopied',
          'Facebook composer opened — attach the downloaded card, paste the caption if needed, tag Padhai.pk, then Post.',
        ),
      };
    case 'instagram':
      return {
        copied: true,
        opened: true,
        method: openResult.method,
        message: openResult.attachedImage
          ? msg(
            config,
            'instagramCopied',
            'Instagram Stories opened with your card — add the caption and tag @padhai.pk, then share.',
          )
          : msg(
            config,
            'instagramOpened',
            'Instagram Stories is opening — pick your downloaded card, paste the caption, and tag @padhai.pk.',
          ),
      };
    default:
      return { copied: false, opened: false, method: 'none', message: 'Sharing is not available on this platform.' };
  }
}
