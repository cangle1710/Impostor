import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { socket } from '../socket.js';

const SocketContext = createContext(null);

const initialState = {
  phase: 'HOME', // HOME | LOBBY | ROLE_REVEAL | DISCUSSION | VOTING | RESULTS
  me: null,       // { id, name }
  roomCode: null,
  players: [],
  settings: {
    numImposters: 1,
    gameMode: 'WORD',
    category: 'all',
    showCategoryToImpostor: false,
    showHintToImpostor: false,
    impostersKnowEachOther: true,
    discussionSeconds: 180,
    allowImpostorGuess: true,
  },
  myRole: null,        // { role, word, question, category, hint, impostorPartners }
  revealState: null,   // { nextPlayerId, revealedCount, totalCount, revealOrder }
  discussion: null,    // { durationSeconds, discussionEndsAt }
  votingPlayers: [],
  votes: {},
  results: null,       // { caught, eliminated, impostors, secret, votes, ... }
  error: null,
  isConnected: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, isConnected: true, error: null };
    case 'DISCONNECTED':
      return { ...state, isConnected: false };
    case 'ROOM_CREATED':
    case 'ROOM_JOINED':
      return {
        ...state,
        phase: 'LOBBY',
        roomCode: action.payload.roomCode,
        me: { id: action.payload.playerId, name: state.pendingName },
        players: action.payload.players,
        settings: action.payload.settings,
        error: null,
      };
    case 'ROOM_REJOINED':
      return {
        ...state,
        phase: action.payload.state === 'LOBBY' ? 'LOBBY' : state.phase,
        roomCode: action.payload.roomCode,
        me: { id: action.payload.playerId, name: state.pendingName || state.me?.name },
        players: action.payload.players,
        settings: action.payload.settings,
        error: null,
      };
    case 'ROOM_UPDATED':
      return { ...state, players: action.payload.players };
    case 'SETTINGS_UPDATED':
      return { ...state, settings: action.payload.settings };
    case 'GAME_STARTING':
      return {
        ...state,
        phase: 'ROLE_REVEAL',
        myRole: null,
        revealState: {
          nextPlayerId: null,
          revealedCount: 0,
          totalCount: action.payload.revealOrder.length,
          revealOrder: action.payload.revealOrder,
        },
        results: null,
        votes: {},
      };
    case 'REVEAL_NEXT':
      return {
        ...state,
        revealState: {
          ...state.revealState,
          nextPlayerId: action.payload.nextPlayerId,
          revealedCount: action.payload.revealedCount,
          totalCount: action.payload.totalCount,
        },
      };
    case 'ROLE_ASSIGNED':
      return { ...state, myRole: action.payload };
    case 'PHASE_DISCUSSION':
      return {
        ...state,
        phase: 'DISCUSSION',
        discussion: {
          durationSeconds: action.payload.durationSeconds,
          discussionEndsAt: action.payload.discussionEndsAt,
        },
      };
    case 'PHASE_VOTING':
      return {
        ...state,
        phase: 'VOTING',
        votingPlayers: action.payload.players,
        votes: {},
      };
    case 'VOTE_UPDATED':
      return { ...state, votes: action.payload.votes };
    case 'PHASE_RESULTS':
      return { ...state, phase: 'RESULTS', results: action.payload };
    case 'GAME_RESTARTED':
      return {
        ...state,
        phase: 'LOBBY',
        players: action.payload.players,
        settings: action.payload.settings,
        myRole: null,
        revealState: null,
        discussion: null,
        results: null,
        votes: {},
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_PENDING_NAME':
      return { ...state, pendingName: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function SocketProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    socket.on('connect', () => dispatch({ type: 'CONNECTED' }));
    socket.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }));

    socket.on('room:created', (payload) => dispatch({ type: 'ROOM_CREATED', payload }));
    socket.on('room:joined', (payload) => dispatch({ type: 'ROOM_JOINED', payload }));
    socket.on('room:rejoined', (payload) => dispatch({ type: 'ROOM_REJOINED', payload }));
    socket.on('room:updated', (payload) => dispatch({ type: 'ROOM_UPDATED', payload }));
    socket.on('settings:updated', (payload) => dispatch({ type: 'SETTINGS_UPDATED', payload }));
    socket.on('game:starting', (payload) => dispatch({ type: 'GAME_STARTING', payload }));
    socket.on('reveal:next', (payload) => dispatch({ type: 'REVEAL_NEXT', payload }));
    socket.on('role:assigned', (payload) => dispatch({ type: 'ROLE_ASSIGNED', payload }));
    socket.on('phase:discussion', (payload) => dispatch({ type: 'PHASE_DISCUSSION', payload }));
    socket.on('phase:voting', (payload) => dispatch({ type: 'PHASE_VOTING', payload }));
    socket.on('vote:updated', (payload) => dispatch({ type: 'VOTE_UPDATED', payload }));
    socket.on('phase:results', (payload) => dispatch({ type: 'PHASE_RESULTS', payload }));
    socket.on('game:restarted', (payload) => dispatch({ type: 'GAME_RESTARTED', payload }));
    socket.on('room:error', ({ message }) => dispatch({ type: 'SET_ERROR', payload: message }));

    return () => socket.removeAllListeners();
  }, []);

  // Reconnection on mount
  useEffect(() => {
    const savedCode = sessionStorage.getItem('roomCode');
    const savedName = sessionStorage.getItem('playerName');
    if (savedCode && savedName) {
      dispatch({ type: 'SET_PENDING_NAME', payload: savedName });
      socket.connect();
      socket.once('connect', () => {
        socket.emit('room:rejoin', { playerName: savedName, roomCode: savedCode });
      });
    }
  }, []);

  // Save session on join
  useEffect(() => {
    if (state.roomCode && state.me?.name) {
      sessionStorage.setItem('roomCode', state.roomCode);
      sessionStorage.setItem('playerName', state.me.name);
    }
  }, [state.roomCode, state.me]);

  const createRoom = useCallback((playerName) => {
    dispatch({ type: 'SET_PENDING_NAME', payload: playerName });
    socket.connect();
    socket.once('connect', () => socket.emit('room:create', { playerName }));
  }, []);

  const joinRoom = useCallback((playerName, roomCode) => {
    dispatch({ type: 'SET_PENDING_NAME', payload: playerName });
    socket.connect();
    socket.once('connect', () =>
      socket.emit('room:join', { playerName, roomCode: roomCode.toUpperCase() })
    );
  }, []);

  const leaveRoom = useCallback(() => {
    socket.disconnect();
    sessionStorage.removeItem('roomCode');
    sessionStorage.removeItem('playerName');
    dispatch({ type: 'RESET' });
  }, []);

  const updateSettings = useCallback((settings) => {
    socket.emit('settings:update', settings);
  }, []);

  const startGame = useCallback(() => {
    socket.emit('game:start');
  }, []);

  const viewRole = useCallback(() => {
    socket.emit('reveal:view');
  }, []);

  const confirmReady = useCallback(() => {
    socket.emit('reveal:ready');
  }, []);

  const skipDiscussion = useCallback(() => {
    socket.emit('discussion:skip');
  }, []);

  const castVote = useCallback((targetId) => {
    socket.emit('vote:cast', { targetId });
  }, []);

  const forceEndVoting = useCallback(() => {
    socket.emit('vote:forceEnd');
  }, []);

  const impostorGuess = useCallback((guess) => {
    socket.emit('impostor:guess', { guess });
  }, []);

  const restartGame = useCallback(() => {
    socket.emit('game:restart');
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  const isHost = state.players.find((p) => p.id === state.me?.id)?.isHost ?? false;

  return (
    <SocketContext.Provider
      value={{
        ...state,
        isHost,
        createRoom,
        joinRoom,
        leaveRoom,
        updateSettings,
        startGame,
        viewRole,
        confirmReady,
        skipDiscussion,
        castVote,
        forceEndVoting,
        impostorGuess,
        restartGame,
        clearError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
