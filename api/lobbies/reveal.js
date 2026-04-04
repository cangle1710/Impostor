import { redis } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, playerId } = req.body;
  if (!code || !playerId) return res.status(400).json({ error: 'code and playerId required' });

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (lobby.hostId !== playerId) return res.status(403).json({ error: 'Only host can reveal results' });
  if (lobby.phase !== 'DISCUSSION') return res.status(409).json({ error: 'Not in discussion phase' });

  const impostors = lobby.round.impostorIds.map((id) => {
    const p = lobby.players.find((pl) => pl.id === id);
    return { id, name: p?.name || 'Unknown' };
  });
  const secret = lobby.settings.gameMode === 'WORD' ? lobby.round.word : lobby.round.regularQuestion;

  const impostorGuessCorrect = lobby.settings.allowImpostorGuess && lobby.round.impostorGuess
    ? lobby.round.impostorGuess.trim().toLowerCase() === (lobby.round.word || '').trim().toLowerCase()
    : false;

  lobby.phase = 'RESULTS';
  lobby.round.results = {
    impostors,
    secret,
    accusation: lobby.round.accusation ?? null,
    impostorGuessCorrect,
    impostorGuess: lobby.round.impostorGuess ?? null,
  };

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });
  return res.status(200).json({ ok: true });
}
