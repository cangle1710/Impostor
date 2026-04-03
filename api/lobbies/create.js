import { redis } from '../_lib/redis.js';

const DEFAULT_SETTINGS = {
  numImposters: 1,
  gameMode: 'WORD',
  category: 'all',
  showCategoryToImpostor: false,
  showHintToImpostor: false,
  impostersKnowEachOther: true,
  discussionSeconds: 180,
  allowImpostorGuess: false,
  allowAccusation: false,
  trackScores: false,
  showRoleFlavor: false,
  chaosMode: false,
};

function genCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { playerId, playerName } = req.body;
  if (!playerId || !playerName?.trim()) {
    return res.status(400).json({ error: 'playerId and playerName required' });
  }

  // Atomic increment — race-condition-safe cap
  const newCount = await redis.incr('lobbies:active');
  if (newCount > 10) {
    await redis.decr('lobbies:active');
    return res.status(429).json({ error: 'Max 10 active lobbies. Try again later.' });
  }

  // Find a unique 4-digit code
  let code;
  for (let i = 0; i < 20; i++) {
    const candidate = genCode();
    const existing = await redis.exists(`lobby:${candidate}`);
    if (!existing) { code = candidate; break; }
  }
  if (!code) {
    await redis.decr('lobbies:active');
    return res.status(503).json({ error: 'Could not generate unique code' });
  }

  const lobby = {
    code,
    hostId: playerId,
    phase: 'LOBBY',
    createdAt: Date.now(),
    players: [{ id: playerId, name: playerName.trim(), isHost: true }],
    settings: { ...DEFAULT_SETTINGS },
    round: null,
  };

  await redis.set(`lobby:${code}`, JSON.stringify(lobby), { ex: 7200 });

  return res.status(200).json({ code, lobby: sanitize(lobby, playerId) });
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
