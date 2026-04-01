import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { buildRound, getRolePayload, resolveVotes } from '../engine.js';

const GameContext = createContext(null);

let nextId = 1;
function genId() { return String(nextId++); }

const DEFAULT_SETTINGS = {
  numImposters: 1,
  gameMode: 'WORD',
  category: 'all',
  showCategoryToImpostor: false,
  showHintToImpostor: false,
  impostersKnowEachOther: true,
  discussionSeconds: 180,
  allowImpostorGuess: true,
};

const initialState = {
  phase: 'SETUP',  // SETUP | ROLE_REVEAL | DISCUSSION | VOTING | RESULTS
  players: [],     // [{ id, name }]
  settings: { ...DEFAULT_SETTINGS },
  round: null,     // { impostorIds, word, hint, categoryLabel, regularQuestion, impostorQuestion, revealOrder }
  revealIndex: 0,  // which index in revealOrder is current
  rolesByPlayer: {},// { [playerId]: rolePayload }
  discussionEndsAt: null,
  votes: {},       // { [targetId]: count }
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
      const round = buildRound(state.players, state.settings);
      // Pre-compute all role payloads now (phone is passed around, all data local)
      const rolesByPlayer = {};
      for (const p of state.players) {
        rolesByPlayer[p.id] = getRolePayload(round, state.settings, state.players, p.id);
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

    case 'START_VOTING':
      return { ...state, phase: 'VOTING', votes: {} };

    case 'CAST_VOTE': {
      const current = state.votes[action.targetId] || 0;
      return { ...state, votes: { ...state.votes, [action.targetId]: current + 1 } };
    }

    case 'SHOW_RESULTS': {
      const results = resolveVotes(state.votes, state.players, state.round, state.settings);
      return { ...state, phase: 'RESULTS', results };
    }

    case 'IMPOSTOR_GUESS_WIN': {
      return {
        ...state,
        phase: 'RESULTS',
        results: {
          caught: false,
          eliminated: null,
          impostors: state.round.impostorIds.map((id) => {
            const p = state.players.find((pl) => pl.id === id);
            return { id, name: p?.name || 'Unknown' };
          }),
          secret: state.round.word,
          impostorGuessedCorrectly: true,
          guesserName: action.guesserName,
          votes: state.votes,
        },
      };
    }

    case 'PLAY_AGAIN':
      return {
        ...state,
        phase: 'SETUP',
        round: null,
        revealIndex: 0,
        rolesByPlayer: {},
        votes: {},
        results: null,
        discussionEndsAt: null,
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

  const startVoting = useCallback(() => {
    if (discussionTimerRef.current) clearTimeout(discussionTimerRef.current);
    dispatch({ type: 'START_VOTING' });
  }, []);

  const castVote = useCallback((targetId) => dispatch({ type: 'CAST_VOTE', targetId }), []);

  const showResults = useCallback(() => dispatch({ type: 'SHOW_RESULTS' }), []);

  const impostorGuessWin = useCallback((guesserName) => {
    dispatch({ type: 'IMPOSTOR_GUESS_WIN', guesserName });
  }, []);

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
      startVoting,
      castVote,
      showResults,
      impostorGuessWin,
      playAgain,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
