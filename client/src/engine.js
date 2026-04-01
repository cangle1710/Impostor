import { wordCategories } from './data/wordData.js';
import { questionCategories } from './data/questionData.js';

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

/**
 * Given players array and settings, returns round data:
 * { impostorIds, word, hint, categoryLabel, regularQuestion, impostorQuestion, revealOrder }
 */
export function buildRound(players, settings) {
  const shuffled = shuffle(players);
  const impostorIds = shuffled.slice(0, settings.numImposters).map((p) => p.id);

  let word = null;
  let hint = null;
  let categoryLabel = null;
  let regularQuestion = null;
  let impostorQuestion = null;

  if (settings.gameMode === 'WORD') {
    const pool =
      settings.category === 'all'
        ? wordCategories
        : wordCategories.filter((c) => c.id === settings.category);
    const cat = pickRandom(pool.length ? pool : wordCategories);
    const entry = pickRandom(cat.words);
    word = entry.word;
    hint = entry.hint;
    categoryLabel = cat.label;
  } else {
    const pool =
      settings.category === 'all'
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

/**
 * Build the role payload for one player, respecting settings toggles.
 */
export function getRolePayload(round, settings, players, playerId) {
  const isImpostor = round.impostorIds.includes(playerId);
  const payload = { role: isImpostor ? 'IMPOSTOR' : 'CREWMATE' };

  if (settings.gameMode === 'WORD') {
    payload.word = isImpostor ? null : round.word;
    payload.hint = isImpostor && settings.showHintToImpostor ? round.hint : null;
    payload.category = isImpostor
      ? (settings.showCategoryToImpostor ? round.categoryLabel : null)
      : round.categoryLabel;
  } else {
    payload.question = isImpostor ? round.impostorQuestion : round.regularQuestion;
    payload.category = round.categoryLabel;
  }

  if (isImpostor && settings.impostersKnowEachOther) {
    payload.impostorPartners = round.impostorIds
      .filter((id) => id !== playerId)
      .map((id) => players.find((p) => p.id === id)?.name)
      .filter(Boolean);
  }

  return payload;
}

/**
 * Resolve votes: { [targetId]: count }
 * Returns { caught, eliminated, tie, impostors, secret }
 */
export function resolveVotes(votes, players, round, settings) {
  const impostors = round.impostorIds.map((id) => {
    const p = players.find((pl) => pl.id === id);
    return { id, name: p?.name || 'Unknown' };
  });

  if (Object.keys(votes).length === 0) {
    return { caught: false, eliminated: null, impostors, secret: null };
  }

  let maxVotes = 0;
  let topTargets = [];
  for (const [targetId, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      topTargets = [targetId];
    } else if (count === maxVotes) {
      topTargets.push(targetId);
    }
  }

  if (topTargets.length > 1) {
    return { caught: false, eliminated: null, tie: true, impostors, votes, secret: settings.gameMode === 'WORD' ? round.word : round.regularQuestion };
  }

  const eliminatedId = topTargets[0];
  const caught = round.impostorIds.includes(eliminatedId);
  const eliminatedPlayer = players.find((p) => p.id === eliminatedId);

  return {
    caught,
    eliminated: eliminatedPlayer ? { id: eliminatedId, name: eliminatedPlayer.name } : null,
    impostors,
    secret: settings.gameMode === 'WORD' ? round.word : round.regularQuestion,
    votes,
  };
}
