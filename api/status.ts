import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'NexusAI Engine v0.0.1 Online', environment: process.env.NODE_ENV || 'production' });
}
