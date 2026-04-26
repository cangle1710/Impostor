import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { buildRound, getRolePayload } from '../engine.js';

const GameContext = createContext(null);

let nextId = 1;
function genId() { return String(nextId++); }

const DEFAULT_SETTINGS = {
  numImposters: 1,
  gameMode: 'WORD',
  category: 'all',
  showCategoryToImpostor: false,
  impostersKnowEachOther: true,
  discussionSeconds: 180,
  // Optional rules (all OFF = original baseline game)
  allowImpostorGuess: false,
  allowAccusation: false,
  trackScores: false,
  showRoleFlavor: false,
  chaosMode: false,
};

const initialState = {
  phase: 'SETUP',  // SETUP | ROLE_REVEAL | DISCUSSION | RESULTS
  players: [],     // [{ id, name }]
  settings: { ...DEFAULT_SETTINGS },
  round: null,     // { impostorIds, word, categoryId, categoryLabel, ... revealOrder }
  revealIndex: 0,  // which index in revealOrder is current
  rolesByPlayer: {},// { [playerId]: rolePayload }
  discussionEndsAt: null,
  accusation: null, // { accusedId, correct } | null
  impostorGuess: null, // string | null (the impostor's guess text)
  scores: {},      // { [playerId]: number } — persists across Play Again
  results: null,
};

function reducer(state, action) {
  switch (action.type) {

    case 'ADD_PLAYER': {
      const id = genId();
      return { ...state, players: [...state.players, { id, name: action.name }] };
    }

    case 'REMOVE_PLAYER': {
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
        settings: {
          ...state.settings,
          numImposters: Math.min(
            state.settings.numImposters,
            Math.max(1, state.players.filter((p) => p.id !== action.id).length - 1)
          ),
        },
      };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.settings };

    case 'START_GAME': {
      let activeSettings = state.settings;
      if (state.settings.chaosMode) {
        const maxImposters = Math.max(1, Math.floor((state.players.length - 1) / 2));
        const randomImposters = Math.floor(Math.random() * maxImposters) + 1;
        activeSettings = { ...state.settings, numImposters: randomImposters };
      }
      const round = buildRound(state.players, activeSettings);
      // Pre-compute all role payloads now (phone is passed around, all data local)
      const rolesByPlayer = {};
      for (const p of state.players) {
        rolesByPlayer[p.id] = getRolePayload(round, activeSettings, state.players, p.id);
      }
      return {
        ...state,
        phase: 'ROLE_REVEAL',
        round,
        rolesByPlayer,
        revealIndex: 0,
        votes: {},
        results: null,
        discussionEndsAt: null,
      };
    }

    case 'ADVANCE_REVEAL':
      return { ...state, revealIndex: state.revealIndex + 1 };

    case 'START_DISCUSSION': {
      const endsAt = Date.now() + state.settings.discussionSeconds * 1000;
      return { ...state, phase: 'DISCUSSION', discussionEndsAt: endsAt };
    }

    case 'SUBMIT_IMPOSTOR_GUESS':
      return { ...state, impostorGuess: action.guess };

    case 'ACCUSE': {
      const { accusedId } = action;
      const correct = state.round.impostorIds.includes(accusedId);
      const accusation = { accusedId, correct };
      if (!correct) {
        // Wrong — stay in discussion, mark failed (no more accusations)
        return { ...state, accusation };
      }
      // Correct — go straight to results
      const impostors = state.round.impostorIds.map((id) => {
        const p = state.players.find((pl) => pl.id === id);
        return { id, name: p?.name || 'Unknown' };
      });
      const secret = state.settings.gameMode === 'WORD' ? state.round.word : state.round.regularQuestion;
      const scores = { ...state.scores };
      if (state.settings.trackScores) {
        for (const p of state.players) {
          if (!state.round.impostorIds.includes(p.id)) scores[p.id] = (scores[p.id] || 0) + 1;
        }
      }
      return { ...state, phase: 'RESULTS', accusation, scores, results: { impostors, secret } };
    }

    case 'REVEAL_RESULTS': {
      const impostors = state.round.impostorIds.map((id) => {
        const p = state.players.find((pl) => pl.id === id);
        return { id, name: p?.name || 'Unknown' };
      });
      const secret = state.settings.gameMode === 'WORD' ? state.round.word : state.round.regularQuestion;
      const impostorGuessCorrect = state.settings.allowImpostorGuess && state.impostorGuess
        ? state.impostorGuess.trim().toLowerCase() === (state.round.word || '').trim().toLowerCase()
        : false;
      const scores = { ...state.scores };
      if (state.settings.trackScores) {
        for (const id of state.round.impostorIds) {
          scores[id] = (scores[id] || 0) + 1;
          if (impostorGuessCorrect) scores[id] = (scores[id] || 0) + 1; // bonus
        }
      }
      return {
        ...state,
        phase: 'RESULTS',
        scores,
        results: { impostors, secret, impostorGuessCorrect, impostorGuess: state.impostorGuess },
      };
    }

    case 'RESET_SCORES':
      return { ...state, scores: {} };

    case 'PLAY_AGAIN':
      return {
        ...state,
        phase: 'SETUP',
        round: null,
        revealIndex: 0,
        rolesByPlayer: {},
        accusation: null,
        impostorGuess: null,
        results: null,
        discussionEndsAt: null,
        // scores preserved intentionally when trackScores is on
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const discussionTimerRef = useRef(null);

  const addPlayer = useCallback((name) => dispatch({ type: 'ADD_PLAYER', name }), []);
  const removePlayer = useCallback((id) => dispatch({ type: 'REMOVE_PLAYER', id }), []);
  const updateSettings = useCallback((settings) => dispatch({ type: 'UPDATE_SETTINGS', settings }), []);

  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), []);

  const advanceReveal = useCallback(() => dispatch({ type: 'ADVANCE_REVEAL' }), []);

  const startDiscussion = useCallback((seconds) => {
    dispatch({ type: 'START_DISCUSSION' });
  }, []);

  const revealResults = useCallback(() => dispatch({ type: 'REVEAL_RESULTS' }), []);

  const accuse = useCallback((accusedId) => dispatch({ type: 'ACCUSE', accusedId }), []);
  const submitImpostorGuess = useCallback((guess) => dispatch({ type: 'SUBMIT_IMPOSTOR_GUESS', guess }), []);
  const resetScores = useCallback(() => dispatch({ type: 'RESET_SCORES' }), []);

  const playAgain = useCallback(() => dispatch({ type: 'PLAY_AGAIN' }), []);

  const currentRevealPlayerId = state.round
    ? state.round.revealOrder[state.revealIndex]
    : null;

  const allRevealed = state.round
    ? state.revealIndex >= state.round.revealOrder.length
    : false;

  return (
    <GameContext.Provider value={{
      ...state,
      currentRevealPlayerId,
      allRevealed,
      addPlayer,
      removePlayer,
      updateSettings,
      startGame,
      advanceReveal,
      startDiscussion,
      revealResults,
      accuse,
      submitImpostorGuess,
      resetScores,
      playAgain,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
