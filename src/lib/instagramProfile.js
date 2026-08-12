export function instagramUsernameFromUrl(url) {
  const match = String(url || '').match(/instagram\.com\/([^/?#]+)/i);
  return match?.[1]?.replace(/\/$/, '') ?? null;
}

export async function fetchInstagramProfilePic(username) {
  const res = await fetch(`/api/instagram-profile?username=${encodeURIComponent(username)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Could not load Instagram profile image.');
  }
  return data.imageUrl;
}
