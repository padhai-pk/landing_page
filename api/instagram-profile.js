import { fetchInstagramProfileImage, parseInstagramUsername } from './lib/fetchInstagramProfile.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const username = parseInstagramUsername(req.query.username);
  if (!username) {
    return res.status(400).json({ error: 'A valid Instagram username is required.' });
  }

  try {
    const profile = await fetchInstagramProfileImage(username);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(profile);
  } catch (err) {
    console.error('instagram-profile lookup failed:', err.message);
    return res.status(502).json({ error: 'Could not fetch Instagram profile image.' });
  }
}
