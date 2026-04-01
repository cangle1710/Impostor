import { wordCategories } from './wordCategories.js';
import { questionCategories } from './questionCategories.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Runs on host's browser when game starts.
// Returns all the round data needed to populate Firebase.
export function computeRound(players, settings) {
  const shuffled = shuffle(players);
  const impostorIds = shuffled.slice(0, settings.numImposters).map((p) => p.id);

  let word = null, hint = null, categoryLabel = null;
  let regularQuestion = null, impostorQuestion = null;

  if (settings.gameMode === 'WORD') {
    const pool = settings.category === 'all'
      ? wordCategories
      : wordCategories.filter((c) => c.id === settings.category);
    const cat = pickRandom(pool.length ? pool : wordCategories);
    const entry = pickRandom(cat.words);
    word = entry.word;
    hint = entry.hint;
    categoryLabel = cat.label;
  } else {
    const pool = settings.category === 'all'
      ? questionCategories
      : questionCategories.filter((c) => c.id === settings.category);
    const cat = pickRandom(pool.length ? pool : questionCategories);
    const pair = pickRandom(cat.pairs);
    regularQuestion = pair.regular;
    impostorQuestion = pair.impostor;
    categoryLabel = cat.label;
  }

  const revealOrder = shuffle(players).map((p) => p.id);

  return { impostorIds, word, hint, categoryLabel, regularQuestion, impostorQuestion, revealOrder };
}

// Builds the private role payload for a single player.
export function buildRolePayload(playerId, round, settings, allPlayers) {
  const isImpostor = round.impostorIds.includes(playerId);

  const payload = { role: isImpostor ? 'IMPOSTOR' : 'CREWMATE' };

  if (settings.gameMode === 'WORD') {
    payload.word     = isImpostor ? null : round.word;
    payload.category = isImpostor
      ? (settings.showCategoryToImpostor ? round.categoryLabel : null)
      : round.categoryLabel;
    payload.hint     = isImpostor && settings.showHintToImpostor ? round.hint : null;
  } else {
    payload.question = isImpostor ? round.impostorQuestion : round.regularQuestion;
    payload.category = round.categoryLabel;
  }

  if (isImpostor && settings.impostersKnowEachOther) {
    payload.impostorPartners = round.impostorIds
      .filter((id) => id !== playerId)
      .map((id) => allPlayers.find((p) => p.id === id)?.name)
      .filter(Boolean);
  }

  return payload;
}

// Resolves votes from a flat players array.
// Returns { caught, eliminated, tie, impostors, secret }
export function resolveVotes(players, round) {
  const tally = {};
  players.forEach((p) => {
    if (p.vote) tally[p.vote] = (tally[p.vote] || 0) + 1;
  });

  if (Object.keys(tally).length === 0) {
    return { caught: false, eliminated: null, tie: false };
  }

  let maxVotes = 0;
  let topTargets = [];
  for (const [id, count] of Object.entries(tally)) {
    if (count > maxVotes)      { maxVotes = count; topTargets = [id]; }
    else if (count === maxVotes) { topTargets.push(id); }
  }

  if (topTargets.length > 1) {
    return { caught: false, eliminated: null, tie: true };
  }

  const eliminatedId = topTargets[0];
  const caught       = round.impostorIds.includes(eliminatedId);
  const eliminated   = { id: eliminatedId, name: players.find((p) => p.id === eliminatedId)?.name || '?' };

  return { caught, eliminated, tie: false };
}
