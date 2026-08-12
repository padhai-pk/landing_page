// Role-based share captions + platform composer URLs for Padhai.pk cards.
// Caption text is loaded from /share-captions.json (editable without code changes).

import { DEFAULT_SHARE_CAPTIONS } from './defaultShareCaptions.js';

let captionsCache = null;
let captionsPromise = null;

/** Load share-captions.json once per session (with built-in fallback). */
export function loadShareCaptions() {
  if (captionsCache) return Promise.resolve(captionsCache);
  if (!captionsPromise) {
    captionsPromise = fetch('/share-captions.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('share-captions.json not found'))))
      .then((data) => {
        captionsCache = deepMergeCaptions(DEFAULT_SHARE_CAPTIONS, data);
        return captionsCache;
      })
      .catch(() => {
        captionsCache = DEFAULT_SHARE_CAPTIONS;
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
  };
}

function firstName(name) {
  return (name || 'I').trim().split(/\s+/)[0];
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

  const subjectList = subjects.filter(Boolean).slice(0, 3);
  const subjectsBlock = subjectList.length
    ? fill(blocks.subjectsLine, { subjects: subjectList.join(' · ') })
    : '';
  const waitlistBlock = waitlistId
    ? fill(blocks.waitlistIdLine, { waitlistId })
    : '';

  const vars = {
    firstName: firstName(name),
    subjects: subjectsBlock,
    waitlistId: waitlistBlock,
    siteUrl,
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
 * Open the best available composer for each platform.
 * Returns { copied, opened, method, message } for UI feedback.
 */
export async function openPlatformShare(platform, { blob, caption, social = {}, config = DEFAULT_SHARE_CAPTIONS }) {
  const siteUrl = siteUrlFromConfig(config);
  const encodedCaption = encodeURIComponent(caption);
  const encodedUrl = encodeURIComponent(siteUrl);
  const copied = await copyCaption(caption);

  const nativeOk = await tryNativeShare(blob, caption, config);
  if (nativeOk) {
    return {
      copied,
      opened: true,
      method: 'native',
      message: msg(config, 'platformNative', 'Share sheet opened with your card and caption.'),
    };
  }

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
        window.open('https://m.facebook.com/composer/', '_blank', 'noopener,noreferrer');
        setTimeout(() => {
          window.location.href = 'fb://composer';
        }, 500);
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
      const igUrl = social.instagram || 'https://www.instagram.com/padhai.pk/';
      if (isMobile()) {
        window.location.href = 'instagram://library';
        setTimeout(() => window.open(igUrl, '_blank', 'noopener,noreferrer'), 800);
      } else {
        window.open(igUrl, '_blank', 'noopener,noreferrer');
      }
      return {
        copied,
        opened: true,
        method: 'instagram',
        message: copied
          ? msg(config, 'instagramCopied', 'Caption copied! Open Instagram to post.')
          : msg(config, 'instagramOpened', 'Card downloaded! Open Instagram to post.'),
      };
    }

    default:
      return { copied, opened: false, method: 'none', message: 'Sharing is not available on this platform.' };
  }
}
