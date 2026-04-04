import { redis } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, playerId, guess } = req.body;
  if (!code || !playerId || !guess?.trim()) {
    return res.status(400).json({ error: 'code, playerId and guess required' });
  }

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (lobby.phase !== 'DISCUSSION') return res.status(409).json({ error: 'Not in discussion phase' });
  if (!lobby.settings.allowImpostorGuess) return res.status(400).json({ error: 'Impostor guess not enabled' });
  if (!lobby.round.impostorIds.includes(playerId)) return res.status(403).json({ error: 'Only impostors can guess' });

  lobby.round.impostorGuess = guess.trim();

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });
  return res.status(200).json({ ok: true });
}
