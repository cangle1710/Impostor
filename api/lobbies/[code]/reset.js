import { redis } from '../../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.query;
  const { playerId } = req.body;

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (lobby.hostId !== playerId) return res.status(403).json({ error: 'Only host can reset' });

  lobby.phase = 'LOBBY';
  lobby.round = null;

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });
  return res.status(200).json({ ok: true });
}
