import { wordCategories } from './data/wordData.js';
import { questionCategories } from './data/questionData.js';

// Role flavor names per word category id
const ROLE_FLAVORS = {
  places:     ['Tourist', 'Tour Guide', 'Local', 'Street Vendor', 'Security Guard', 'Janitor', 'Manager', 'New Employee'],
  food:       ['Chef', 'Food Critic', 'Waiter', 'Dishwasher', 'Sous Chef', 'Pastry Chef', 'Sommelier', 'Health Inspector'],
  sports:     ['Athlete', 'Coach', 'Referee', 'Commentator', 'Physio', 'Team Manager', 'Superfan', 'Mascot'],
  movies:     ['Director', 'Actor', 'Screenwriter', 'Cinematographer', 'Producer', 'Stunt Double', 'Makeup Artist', 'Set Designer'],
  nature:     ['Park Ranger', 'Scientist', 'Hiker', 'Photographer', 'Botanist', 'Wildlife Vet', 'Explorer', 'Conservation Officer'],
  jobs:       ['Trainee', 'Supervisor', 'Client', 'Inspector', 'Intern', 'Veteran', 'Recruiter', 'Union Rep'],
  animals:    ['Zookeeper', 'Vet', 'Trainer', 'Researcher', 'Wildlife Photographer', 'Conservationist', 'Breeder', 'Volunteer'],
  technology: ['Developer', 'QA Tester', 'Designer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'Security Analyst', 'CTO'],
  hobbies:    ['Beginner', 'Expert', 'Instructor', 'Judge', 'Organizer', 'Enthusiast', 'Sponsor', 'Critic'],
  school:     ['Student', 'Teacher', 'Principal', 'Tutor', 'Parent', 'Counselor', 'Substitute', 'Lab Assistant'],
  music:      ['Musician', 'Sound Engineer', 'Producer', 'Roadie', 'Manager', 'Critic', 'Groupie', 'Promoter'],
  vehicles:   ['Driver', 'Mechanic', 'Passenger', 'Engineer', 'Traffic Controller', 'Inspector', 'Designer', 'Fuel Attendant'],
  fantasy:    ['Warrior', 'Mage', 'Ranger', 'Bard', 'Cleric', 'Rogue', 'Paladin', 'Druid'],
  space:      ['Astronaut', 'Mission Control', 'Engineer', 'Scientist', 'Commander', 'Pilot', 'Geologist', 'Comms Officer'],
  restaurants:['Chef', 'Waiter', 'Sommelier', 'Host', 'Busser', 'Kitchen Manager', 'Food Critic', 'Regular'],
  holidays:   ['Organizer', 'First-Timer', 'Traditionalist', 'Vendor', 'Volunteer', 'Celebrity Guest', 'Security', 'Photographer'],
  emotions:   ['Therapist', 'Life Coach', 'Author', 'Actor', 'Researcher', 'Philosopher', 'Support Leader', 'Artist'],
  clothing:   ['Fashion Designer', 'Model', 'Stylist', 'Buyer', 'Seamstress', 'Photographer', 'Store Manager', 'Trend Forecaster'],
};
const DEFAULT_ROLES = ['Investigator', 'Witness', 'Observer', 'Participant', 'Specialist', 'Expert', 'Consultant', 'Analyst'];

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
 * { impostorIds, word, categoryLabel, regularQuestion, impostorQuestion, revealOrder }
 */
export function buildRound(players, settings) {
  const shuffled = shuffle(players);
  const impostorIds = shuffled.slice(0, settings.numImposters).map((p) => p.id);

  let word = null;
  let categoryId = null;
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
    categoryId = cat.id;
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
    categoryId = cat.id;
    categoryLabel = cat.label;
  }

  const revealOrder = shuffle(players).map((p) => p.id);

  return { impostorIds, word, categoryId, categoryLabel, regularQuestion, impostorQuestion, revealOrder };
}

/**
 * Build the role payload for one player, respecting settings toggles.
 */
export function getRolePayload(round, settings, players, playerId) {
  const isImpostor = round.impostorIds.includes(playerId);
  const payload = { role: isImpostor ? 'IMPOSTOR' : 'CREWMATE' };

  if (settings.gameMode === 'WORD') {
    payload.word = isImpostor ? null : round.word;
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

  if (!isImpostor && settings.showRoleFlavor) {
    const flavors = ROLE_FLAVORS[round.categoryId] || DEFAULT_ROLES;
    payload.roleName = pickRandom(flavors);
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
