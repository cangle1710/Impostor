import { redis } from '../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, playerId, playerName } = req.body;
  if (!code || !playerId || !playerName?.trim()) {
    return res.status(400).json({ error: 'code, playerId and playerName required' });
  }

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;

  // Reconnect: player already in lobby
  const existing = lobby.players.find((p) => p.id === playerId);
  if (existing) {
    return res.status(200).json({ lobby: sanitize(lobby, playerId) });
  }

  if (lobby.phase !== 'LOBBY') {
    return res.status(409).json({ error: 'Game already in progress' });
  }

  lobby.players.push({ id: playerId, name: playerName.trim(), isHost: false });
  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });

  return res.status(200).json({ lobby: sanitize(lobby, playerId) });
}

function sanitize(lobby, playerId) {
  if (!lobby.round) return lobby;
  return {
    ...lobby,
    round: {
      discussionEndsAt: lobby.round.discussionEndsAt ?? null,
      results: lobby.round.results ?? null,
      categoryLabel: lobby.round.categoryLabel ?? null,
      rolesByPlayer: { [playerId]: lobby.round.rolesByPlayer?.[playerId] ?? null },
    },
  };
}
