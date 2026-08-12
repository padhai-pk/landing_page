const USERNAME_RE = /^[a-zA-Z0-9._]{1,30}$/;

export function parseInstagramUsername(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  const fromUrl = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  const raw = (fromUrl ? fromUrl[1] : trimmed.replace(/^@/, '')).replace(/\/$/, '');
  return USERNAME_RE.test(raw) ? raw : null;
}

export async function fetchInstagramProfileImage(username) {
  const safeUsername = parseInstagramUsername(username);
  if (!safeUsername) {
    throw new Error('Invalid Instagram username.');
  }

  const response = await fetch(`https://www.instagram.com/${safeUsername}/`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Dest': 'document',
    },
  });

  if (!response.ok) {
    throw new Error(`Instagram profile request failed (${response.status}).`);
  }

  const html = await response.text();
  const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
  if (!match?.[1]) {
    throw new Error('Profile image not found on Instagram page.');
  }

  const imageUrl = match[1]
    .replace(/&amp;/g, '&')
    .replace(/s100x100/, 's320x320');

  return { username: safeUsername, imageUrl };
}
