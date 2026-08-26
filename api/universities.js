// api/universities.js — proxy Hipolabs university search (avoids browser CORS).

const HIPOLABS_BASE = 'http://universities.hipolabs.com/search';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const country = String(req.query?.country || '').trim();
  if (!country) {
    res.status(400).json({ error: 'country query parameter is required.' });
    return;
  }

  try {
    const params = new URLSearchParams({ country });
    const upstream = await fetch(`${HIPOLABS_BASE}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'University lookup failed.' });
      return;
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('universities proxy failed:', err.message);
    res.status(502).json({ error: 'Could not reach the university directory.' });
  }
}
