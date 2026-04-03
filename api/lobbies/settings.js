import { redis } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();

  const { code, playerId, settings } = req.body;
  if (!code || !playerId) return res.status(400).json({ error: 'code and playerId required' });

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (lobby.hostId !== playerId) return res.status(403).json({ error: 'Only host can change settings' });
  if (lobby.phase !== 'LOBBY') return res.status(409).json({ error: 'Cannot change settings mid-game' });

  lobby.settings = { ...lobby.settings, ...settings };

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });
  return res.status(200).json({ ok: true });
}
