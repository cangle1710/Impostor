import { redis } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, playerId, accusedId } = req.body;
  if (!code || !playerId || !accusedId) {
    return res.status(400).json({ error: 'code, playerId and accusedId required' });
  }

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (lobby.phase !== 'DISCUSSION') return res.status(409).json({ error: 'Not in discussion phase' });
  if (!lobby.settings.allowAccusation) return res.status(400).json({ error: 'Accusations not enabled' });
  if (lobby.round.accusation) return res.status(409).json({ error: 'Accusation already made' });

  const correct = lobby.round.impostorIds.includes(accusedId);
  const accusedPlayer = lobby.players.find((p) => p.id === accusedId);
  lobby.round.accusation = { accusedId, accusedName: accusedPlayer?.name || 'Unknown', correct };

  if (correct) {
    const impostors = lobby.round.impostorIds.map((id) => {
      const p = lobby.players.find((pl) => pl.id === id);
      return { id, name: p?.name || 'Unknown' };
    });
    const secret = lobby.settings.gameMode === 'WORD' ? lobby.round.word : lobby.round.regularQuestion;
    lobby.phase = 'RESULTS';
    lobby.round.results = { impostors, secret, accusation: lobby.round.accusation };
  }

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });
  return res.status(200).json({ ok: true, correct });
}
