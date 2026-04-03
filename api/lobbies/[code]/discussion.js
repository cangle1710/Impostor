import { redis } from '../../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.query;
  const { playerId } = req.body;

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (lobby.hostId !== playerId) return res.status(403).json({ error: 'Only host can start discussion' });
  if (lobby.phase !== 'ROLE_REVEAL') return res.status(409).json({ error: 'Not in role reveal phase' });

  lobby.phase = 'DISCUSSION';
  lobby.round.discussionEndsAt = Date.now() + lobby.settings.discussionSeconds * 1000;

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });

  return res.status(200).json({ ok: true });
}
