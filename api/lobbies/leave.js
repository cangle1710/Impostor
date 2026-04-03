import { redis } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, playerId } = req.body;
  if (!code || !playerId) return res.status(400).json({ error: 'code and playerId required' });

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(200).json({ ok: true });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;
  lobby.players = lobby.players.filter((p) => p.id !== playerId);

  if (lobby.players.length === 0) {
    await redis.del(`lobby:${code}`);
    const count = await redis.decr('lobbies:active');
    if (count < 0) await redis.set('lobbies:active', 0);
    return res.status(200).json({ ok: true });
  }

  if (lobby.hostId === playerId) {
    lobby.hostId = lobby.players[0].id;
    lobby.players[0].isHost = true;
  }

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });
  return res.status(200).json({ ok: true });
}
