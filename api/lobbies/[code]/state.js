import { redis } from '../../_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { code, playerId } = req.query;
  if (!code || !playerId) return res.status(400).json({ error: 'code and playerId required' });

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return res.status(200).json({ lobby: sanitize(lobby, playerId) });
}

function sanitize(lobby, playerId) {
  if (!lobby.round?.rolesByPlayer) return lobby;
  return {
    ...lobby,
    round: {
      ...lobby.round,
      rolesByPlayer: { [playerId]: lobby.round.rolesByPlayer[playerId] ?? null },
    },
  };
}
