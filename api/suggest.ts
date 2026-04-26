import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) {
    return res.status(200).json([]);
  }
  try {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    res.status(200).json(data[1] || []);
  } catch (error) {
    console.error('Suggestion fetch failed:', error);
    res.status(200).json([]);
  }
}
