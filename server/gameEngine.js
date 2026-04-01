import { wordCategories } from './data/wordCategories.js';
import { questionCategories } from './data/questionCategories.js';

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

export function assignRoles(room) {
  const { settings, players } = room;
  const connected = players.filter((p) => p.isConnected);
  const shuffled = shuffle(connected);
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

  // Reset per-round player fields
  players.forEach((p) => {
    p.hasRevealed = false;
    p.hasVoted = false;
    p.vote = null;
  });

  const revealOrder = shuffle(connected).map((p) => p.id);

  room.state = 'ROLE_REVEAL';
  room.round = {
    impostorIds,
    word,
    hint,
    regularQuestion,
    impostorQuestion,
    categoryLabel,
    revealOrder,
    revealIndex: 0,
    votes: {},
    discussionEndsAt: null,
    discussionTimer: null,
  };

  return impostorIds;
}

export function getRolePayload(room, playerId) {
  const { round, settings } = room;
  const isImpostor = round.impostorIds.includes(playerId);

  const payload = {
    role: isImpostor ? 'IMPOSTOR' : 'CREWMATE',
  };

  if (settings.gameMode === 'WORD') {
    payload.word = isImpostor ? null : round.word;
    payload.hint = isImpostor && settings.showHintToImpostor ? round.hint : null;
    payload.category =
      isImpostor && settings.showCategoryToImpostor ? round.categoryLabel : null;
    if (!isImpostor) payload.category = round.categoryLabel; // crewmates always see category
  } else {
    payload.question = isImpostor ? round.impostorQuestion : round.regularQuestion;
    payload.category =
      isImpostor && settings.showCategoryToImpostor ? round.categoryLabel : round.categoryLabel;
  }

  if (isImpostor && settings.impostersKnowEachOther) {
    payload.impostorPartners = round.impostorIds
      .filter((id) => id !== playerId)
      .map((id) => room.players.find((p) => p.id === id)?.name)
      .filter(Boolean);
  }

  return payload;
}

export function advanceReveal(room) {
  room.round.revealIndex += 1;
  const player = room.players.find(
    (p) => p.id === room.round.revealOrder[room.round.revealIndex - 1]
  );
  if (player) player.hasRevealed = true;
}

export function allRevealed(room) {
  return room.round.revealIndex >= room.round.revealOrder.length;
}

export function castVote(room, voterId, targetId) {
  const voter = room.players.find((p) => p.id === voterId);
  if (!voter || voter.hasVoted) return false;
  voter.hasVoted = true;
  voter.vote = targetId;
  if (!room.round.votes[targetId]) room.round.votes[targetId] = [];
  room.round.votes[targetId].push(voterId);
  return true;
}

export function allVoted(room) {
  const connected = room.players.filter((p) => p.isConnected);
  return connected.every((p) => p.hasVoted);
}

export function resolveVotes(room) {
  const { votes, impostorIds } = room.round;
  if (Object.keys(votes).length === 0) {
    return { caught: false, eliminated: null, impostors: getImpostorNames(room) };
  }

  // Find who got most votes
  let maxVotes = 0;
  let topTargets = [];
  for (const [targetId, voters] of Object.entries(votes)) {
    if (voters.length > maxVotes) {
      maxVotes = voters.length;
      topTargets = [targetId];
    } else if (voters.length === maxVotes) {
      topTargets.push(targetId);
    }
  }

  // Tie = no elimination
  if (topTargets.length > 1) {
    return { caught: false, eliminated: null, tie: true, impostors: getImpostorNames(room) };
  }

  const eliminatedId = topTargets[0];
  const caught = impostorIds.includes(eliminatedId);
  const eliminatedPlayer = room.players.find((p) => p.id === eliminatedId);

  return {
    caught,
    eliminated: eliminatedPlayer ? { id: eliminatedId, name: eliminatedPlayer.name } : null,
    impostors: getImpostorNames(room),
    secret:
      room.settings.gameMode === 'WORD'
        ? room.round.word
        : room.round.regularQuestion,
    votes: summarizeVotes(room),
  };
}

function getImpostorNames(room) {
  return room.round.impostorIds.map((id) => {
    const p = room.players.find((pl) => pl.id === id);
    return { id, name: p?.name || 'Unknown' };
  });
}

function summarizeVotes(room) {
  const result = {};
  for (const [targetId, voters] of Object.entries(room.round.votes)) {
    result[targetId] = voters.length;
  }
  return result;
}
