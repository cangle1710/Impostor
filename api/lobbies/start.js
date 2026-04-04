import { redis } from '../_lib/redis.js';
import { buildRound, getRolePayload } from '../_lib/engine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, playerId } = req.body;
  if (!code || !playerId) return res.status(400).json({ error: 'code and playerId required' });

  const raw = await redis.get(`lobby:${code}`);
  if (!raw) return res.status(404).json({ error: 'Lobby not found' });

  const lobby = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (lobby.hostId !== playerId) return res.status(403).json({ error: 'Only host can start' });
  if (lobby.phase !== 'LOBBY') return res.status(409).json({ error: 'Game already started' });
  if (lobby.players.length < 3) return res.status(400).json({ error: 'Need at least 3 players' });

  const maxImposters = Math.max(1, Math.floor((lobby.players.length - 1) / 2));
  let activeSettings = lobby.settings;
  if (lobby.settings.chaosMode) {
    const randomImposters = Math.floor(Math.random() * maxImposters) + 1;
    activeSettings = { ...lobby.settings, numImposters: randomImposters };
  } else if (activeSettings.numImposters > maxImposters) {
    activeSettings = { ...lobby.settings, numImposters: maxImposters };
  }

  const round = buildRound(lobby.players, activeSettings);
  const rolesByPlayer = {};
  for (const p of lobby.players) {
    rolesByPlayer[p.id] = getRolePayload(round, activeSettings, lobby.players, p.id);
  }

  lobby.phase = 'ROLE_REVEAL';
  lobby.round = { ...round, rolesByPlayer, discussionEndsAt: null, results: null };

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });
  return res.status(200).json({ ok: true });
}
