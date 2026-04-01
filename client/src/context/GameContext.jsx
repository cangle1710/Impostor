import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';
import { ref, set, get, update, onValue, onDisconnect } from 'firebase/database';
import { db } from '../firebase.js';
import { computeRound, buildRolePayload, resolveVotes } from '../game/engine.js';

const GameContext = createContext(null);

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

// Stable player ID stored in localStorage
function getPlayerId() {
  let id = localStorage.getItem('impostorPlayerId');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('impostorPlayerId', id); }
  return id;
}

const initialState = {
  phase: 'HOME',
  me: null,
  roomCode: null,
  players: [],
  settings: DEFAULT_SETTINGS,
  myRole: null,
  revealState: null,
  discussion: null,
  votingPlayers: [],
  votes: {},
  results: null,
  error: null,
  isHost: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ENTER_ROOM':
      return { ...state, phase: 'LOBBY', roomCode: action.roomCode, me: action.me, error: null };
    case 'SYNC':
      return { ...state, ...action.payload };
    case 'SET_ROLE':
      return { ...state, myRole: action.role };
    case 'SET_ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const playerId        = useRef(getPlayerId()).current;
  const discussionTimer = useRef(null);
  const unsubscribe     = useRef(null);
  // Keep a ref to state.roomCode so callbacks don't go stale
  const roomCodeRef     = useRef(null);
  const isHostRef       = useRef(false);

  // ── Firebase room listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!state.roomCode) return;
    roomCodeRef.current = state.roomCode;

    const roomRef = ref(db, `rooms/${state.roomCode}`);

    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      const code = roomCodeRef.current;

      if (!data) {
        sessionStorage.removeItem('roomCode');
        sessionStorage.removeItem('playerName');
        clearTimeout(discussionTimer.current);
        dispatch({ type: 'RESET' });
        return;
      }

      const players = Object.entries(data.players || {})
        .map(([id, p]) => ({ id, ...p }))
        .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

      const me     = players.find((p) => p.id === playerId);
      const isHost = data.hostId === playerId;
      isHostRef.current = isHost;

      const phase    = data.state || 'LOBBY';
      const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };

      // ── Phase-derived state ───────────────────────────────────────────────
      let revealState  = null;
      let discussion   = null;
      let votingPlayers = [];
      let votes        = {};
      let results      = null;

      if (phase === 'ROLE_REVEAL' && data.round) {
        revealState = {
          nextPlayerId: data.round.revealOrder?.[data.round.revealIndex] ?? null,
          revealedCount: data.round.revealIndex ?? 0,
          totalCount:    data.round.revealOrder?.length ?? 0,
        };
      }

      if (phase === 'DISCUSSION' && data.round) {
        discussion = {
          durationSeconds:  settings.discussionSeconds,
          discussionEndsAt: data.round.discussionEndsAt,
        };
      }

      if (phase === 'VOTING') {
        votingPlayers = players;
        players.forEach((p) => {
          if (p.vote) votes[p.vote] = (votes[p.vote] || 0) + 1;
        });
      }

      if (phase === 'RESULTS' && data.round) {
        const tally = {};
        players.forEach((p) => { if (p.vote) tally[p.vote] = (tally[p.vote] || 0) + 1; });
        results = {
          caught:   data.round.caught   ?? false,
          tie:      data.round.tie      ?? false,
          eliminated:              data.round.eliminated ?? null,
          impostorGuessedCorrectly: data.round.impostorGuessedCorrectly ?? false,
          guesserName:             data.round.guesserName ?? null,
          impostors: (data.round.impostorIds || []).map((id) => ({
            id, name: players.find((p) => p.id === id)?.name || '?',
          })),
          secret: data.round.word || data.round.regularQuestion || null,
          votes:  tally,
        };
      }

      dispatch({
        type: 'SYNC',
        payload: {
          phase, players, settings, revealState, discussion,
          votingPlayers, votes, results, isHost,
          me: me ? { id: me.id, name: me.name } : (state.me),
        },
      });

      // ── Host duties ───────────────────────────────────────────────────────
      if (isHost) {
        // Auto-start discussion when all connected players have revealed
        if (phase === 'ROLE_REVEAL' && data.round) {
          const connected = players.filter((p) => p.isConnected);
          if (connected.length > 0 && connected.every((p) => p.hasRevealed)) {
            const endsAt = Date.now() + settings.discussionSeconds * 1000;
            update(ref(db, `rooms/${code}`), {
              state: 'DISCUSSION',
              'round/discussionEndsAt': endsAt,
            });
          }
        }

        // Manage discussion countdown → auto-start voting
        if (phase === 'DISCUSSION' && data.round?.discussionEndsAt) {
          clearTimeout(discussionTimer.current);
          const remaining = data.round.discussionEndsAt - Date.now();
          const startVoting = () => update(ref(db, `rooms/${code}`), { state: 'VOTING' });
          if (remaining <= 0) {
            startVoting();
          } else {
            discussionTimer.current = setTimeout(startVoting, remaining);
          }
        } else if (phase !== 'DISCUSSION') {
          clearTimeout(discussionTimer.current);
        }

        // Auto-end voting when all connected players have voted
        if (phase === 'VOTING' && data.round) {
          const connected = players.filter((p) => p.isConnected);
          if (connected.length > 0 && connected.every((p) => p.hasVoted)) {
            doEndVoting(code, players, data.round);
          }
        }
      }
    });

    unsubscribe.current = unsub;
    return () => {
      unsub();
      clearTimeout(discussionTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.roomCode]);

  // ── Reconnect on page load ────────────────────────────────────────────────
  useEffect(() => {
    const savedCode = sessionStorage.getItem('roomCode');
    const savedName = sessionStorage.getItem('playerName');
    if (!savedCode || !savedName) return;

    (async () => {
      const snap = await get(ref(db, `rooms/${savedCode}/players/${playerId}`));
      if (!snap.exists()) {
        sessionStorage.removeItem('roomCode');
        sessionStorage.removeItem('playerName');
        return;
      }
      await update(ref(db, `rooms/${savedCode}/players/${playerId}`), { isConnected: true });
      onDisconnect(ref(db, `rooms/${savedCode}/players/${playerId}`)).update({ isConnected: false });
      dispatch({ type: 'ENTER_ROOM', roomCode: savedCode, me: { id: playerId, name: savedName } });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function doEndVoting(code, players, round) {
    // Guard: only proceed if still in VOTING
    const stateSnap = await get(ref(db, `rooms/${code}/state`));
    if (stateSnap.val() !== 'VOTING') return;

    const { caught, eliminated, tie } = resolveVotes(players, round);

    await update(ref(db, `rooms/${code}`), {
      state: 'RESULTS',
      'round/caught':     caught,
      'round/eliminated': eliminated ?? null,
      'round/tie':        tie,
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  const createRoom = useCallback(async (playerName) => {
    const name = playerName.trim().slice(0, 20);
    if (!name) return;

    // Find an unused 4-digit code
    let code;
    for (let i = 0; i < 10; i++) {
      code = String(Math.floor(1000 + Math.random() * 9000));
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) break;
      code = null;
    }
    if (!code) {
      dispatch({ type: 'SET_ERROR', message: 'Could not create room. Try again.' });
      return;
    }

    await set(ref(db, `rooms/${code}`), {
      state:    'LOBBY',
      hostId:   playerId,
      settings: DEFAULT_SETTINGS,
      players: {
        [playerId]: { name, isHost: true, isConnected: true, hasRevealed: false, hasVoted: false, vote: null, joinedAt: Date.now() },
      },
    });

    onDisconnect(ref(db, `rooms/${code}/players/${playerId}`)).update({ isConnected: false });

    sessionStorage.setItem('roomCode', code);
    sessionStorage.setItem('playerName', name);
    dispatch({ type: 'ENTER_ROOM', roomCode: code, me: { id: playerId, name } });
  }, [playerId]);

  const joinRoom = useCallback(async (playerName, roomCode) => {
    const name = playerName.trim().slice(0, 20);
    const code = roomCode.trim();
    if (!name || code.length !== 4) return;

    let roomData;
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) { dispatch({ type: 'SET_ERROR', message: 'Room not found.' }); return; }
      roomData = snap.val();
    } catch {
      dispatch({ type: 'SET_ERROR', message: 'Could not connect to Firebase. Check your config.' });
      return;
    }

    if (roomData.state !== 'LOBBY') {
      dispatch({ type: 'SET_ERROR', message: 'Game already in progress.' }); return;
    }
    const existing = Object.values(roomData.players || {});
    if (existing.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      dispatch({ type: 'SET_ERROR', message: 'That name is already taken.' }); return;
    }
    if (existing.length >= 20) {
      dispatch({ type: 'SET_ERROR', message: 'Room is full.' }); return;
    }

    await update(ref(db, `rooms/${code}/players/${playerId}`), {
      name, isHost: false, isConnected: true, hasRevealed: false, hasVoted: false, vote: null, joinedAt: Date.now(),
    });

    onDisconnect(ref(db, `rooms/${code}/players/${playerId}`)).update({ isConnected: false });

    sessionStorage.setItem('roomCode', code);
    sessionStorage.setItem('playerName', name);
    dispatch({ type: 'ENTER_ROOM', roomCode: code, me: { id: playerId, name } });
  }, [playerId]);

  const leaveRoom = useCallback(async () => {
    const code = roomCodeRef.current;
    if (code) {
      await update(ref(db, `rooms/${code}/players/${playerId}`), { isConnected: false });
    }
    clearTimeout(discussionTimer.current);
    if (unsubscribe.current) unsubscribe.current();
    sessionStorage.removeItem('roomCode');
    sessionStorage.removeItem('playerName');
    dispatch({ type: 'RESET' });
  }, [playerId]);

  const updateSettings = useCallback(async (settings) => {
    const code = roomCodeRef.current;
    if (!code || !isHostRef.current) return;
    const connected = state.players.filter((p) => p.isConnected).length;
    const numImposters = Math.min(Math.max(1, settings.numImposters), Math.max(1, connected - 1));
    await update(ref(db, `rooms/${code}/settings`), { ...settings, numImposters });
  }, [state.players]);

  const startGame = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || !isHostRef.current) return;

    const connected = state.players.filter((p) => p.isConnected);
    if (connected.length < 2) { dispatch({ type: 'SET_ERROR', message: 'Need at least 2 players.' }); return; }
    if (state.settings.numImposters >= connected.length) { dispatch({ type: 'SET_ERROR', message: 'Too many impostors.' }); return; }

    const round = computeRound(connected, state.settings);

    // Build per-player roles
    const playerRoles = {};
    connected.forEach((p) => {
      playerRoles[p.id] = buildRolePayload(p.id, round, state.settings, connected);
    });

    // Reset per-round player fields
    const playerUpdates = {};
    connected.forEach((p) => {
      playerUpdates[`players/${p.id}/hasRevealed`] = false;
      playerUpdates[`players/${p.id}/hasVoted`]    = false;
      playerUpdates[`players/${p.id}/vote`]        = null;
    });

    await update(ref(db, `rooms/${code}`), {
      state: 'ROLE_REVEAL',
      playerRoles,
      round: {
        impostorIds:      round.impostorIds,
        word:             round.word             ?? null,
        hint:             round.hint             ?? null,
        categoryLabel:    round.categoryLabel    ?? null,
        regularQuestion:  round.regularQuestion  ?? null,
        impostorQuestion: round.impostorQuestion ?? null,
        revealOrder:      round.revealOrder,
        revealIndex:      0,
        discussionEndsAt: null,
        caught:           null,
        eliminated:       null,
        tie:              null,
        impostorGuessedCorrectly: false,
        guesserName:      null,
      },
      ...playerUpdates,
    });
  }, [state.players, state.settings]);

  const viewRole = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code) return;
    const snap = await get(ref(db, `rooms/${code}/playerRoles/${playerId}`));
    if (snap.exists()) dispatch({ type: 'SET_ROLE', role: snap.val() });
  }, [playerId]);

  const confirmReady = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || !state.revealState) return;
    if (state.revealState.nextPlayerId !== playerId) return;

    const newIndex = state.revealState.revealedCount + 1;
    await update(ref(db, `rooms/${code}`), {
      [`players/${playerId}/hasRevealed`]: true,
      'round/revealIndex': newIndex,
    });
  }, [playerId, state.revealState]);

  const skipDiscussion = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || !isHostRef.current) return;
    clearTimeout(discussionTimer.current);
    await update(ref(db, `rooms/${code}`), { state: 'VOTING' });
  }, []);

  const castVote = useCallback(async (targetId) => {
    const code = roomCodeRef.current;
    if (!code) return;
    await update(ref(db, `rooms/${code}/players/${playerId}`), { hasVoted: true, vote: targetId });
    // Host's onValue listener will detect all-voted and end the round
  }, [playerId]);

  const forceEndVoting = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || !isHostRef.current) return;
    const snap = await get(ref(db, `rooms/${code}`));
    const data = snap.val();
    if (!data || data.state !== 'VOTING') return;
    const players = Object.entries(data.players || {}).map(([id, p]) => ({ id, ...p }));
    await doEndVoting(code, players, data.round);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const impostorGuess = useCallback(async (guess) => {
    const code = roomCodeRef.current;
    if (!code) return;
    const snap = await get(ref(db, `rooms/${code}/round`));
    const round = snap.val();
    if (!round?.word) return;

    const correct = guess.trim().toLowerCase() === round.word.toLowerCase();
    if (correct) {
      await update(ref(db, `rooms/${code}`), {
        state: 'RESULTS',
        'round/caught': false,
        'round/eliminated': null,
        'round/tie': false,
        'round/impostorGuessedCorrectly': true,
        'round/guesserName': state.me?.name ?? 'Impostor',
      });
    } else {
      dispatch({ type: 'SET_ERROR', message: 'Wrong guess! You may have revealed yourself.' });
    }
  }, [state.me]);

  const restartGame = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || !isHostRef.current) return;
    clearTimeout(discussionTimer.current);

    const playerUpdates = {};
    state.players.forEach((p) => {
      playerUpdates[`players/${p.id}/hasRevealed`] = false;
      playerUpdates[`players/${p.id}/hasVoted`]    = false;
      playerUpdates[`players/${p.id}/vote`]        = null;
    });

    await update(ref(db, `rooms/${code}`), {
      state: 'LOBBY',
      round: null,
      playerRoles: null,
      ...playerUpdates,
    });

    dispatch({ type: 'SET_ROLE', role: null });
  }, [state.players]);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  return (
    <GameContext.Provider value={{
      ...state,
      createRoom, joinRoom, leaveRoom,
      updateSettings, startGame,
      viewRole, confirmReady,
      skipDiscussion, castVote, forceEndVoting,
      impostorGuess, restartGame, clearError,
    }}>
      {children}
    </GameContext.Provider>
  );
}

// Keep the same hook name so no pages need changing
export function useSocket() {
  return useContext(GameContext);
}
