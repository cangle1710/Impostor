import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerIdentity } from '../hooks/usePlayerIdentity.js';

const LobbyContext = createContext(null);

const POLL_INTERVAL = 2500;

export function LobbyProvider({ children }) {
  const { playerId, playerName, setName } = usePlayerIdentity();

  const [lobbyCode, setLobbyCode] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pollRef = useRef(null);

  // Derived values
  const phase = lobby?.phase ?? 'IDLE';
  const players = lobby?.players ?? [];
  const settings = lobby?.settings ?? null;
  const isHost = lobby ? lobby.hostId === playerId : false;
  const myRole = lobby?.round?.rolesByPlayer?.[playerId] ?? null;
  const round = lobby?.round
    ? { discussionEndsAt: lobby.round.discussionEndsAt, results: lobby.round.results, categoryLabel: lobby.round.categoryLabel }
    : null;

  // ── Polling ──────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((code, pid) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/lobbies/state?code=${code}&playerId=${pid}&t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (res.status === 404) { setLobby(null); setLobbyCode(null); stopPolling(); return; }
        if (!res.ok) {
          console.error('[poll] non-OK response:', res.status, await res.text().catch(() => ''));
          return;
        }
        const data = await res.json();
        setLobby(data.lobby);
      } catch (err) {
        console.error('[poll] fetch error:', err);
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Actions ──────────────────────────────────────────────────────────────
  async function createLobby(name) {
    setName(name);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lobbies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName: name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to create lobby'); return; }
      setLobby(data.lobby);
      setLobbyCode(data.code);
      startPolling(data.code, playerId);
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  async function joinLobby(code, name) {
    setName(name);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lobbies/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, playerId, playerName: name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to join lobby'); return; }
      setLobby(data.lobby);
      setLobbyCode(code);
      startPolling(code, playerId);
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  async function updateSettings(newSettings) {
    if (!lobbyCode) return;
    setLobby((prev) => prev ? { ...prev, settings: { ...prev.settings, ...newSettings } } : prev);
    await fetch('/api/lobbies/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: lobbyCode, playerId, settings: newSettings }),
    });
  }

  async function startGame() {
    if (!lobbyCode) return;
    await fetch('/api/lobbies/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: lobbyCode, playerId }),
    });
  }

  async function startDiscussion() {
    if (!lobbyCode) return;
    await fetch('/api/lobbies/discussion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: lobbyCode, playerId }),
    });
  }

  async function revealResults() {
    if (!lobbyCode) return;
    await fetch('/api/lobbies/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: lobbyCode, playerId }),
    });
  }

  async function playAgain() {
    if (!lobbyCode) return;
    await fetch('/api/lobbies/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: lobbyCode, playerId }),
    });
  }

  async function leaveLobby() {
    stopPolling();
    if (lobbyCode) {
      await fetch('/api/lobbies/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: lobbyCode, playerId }),
      }).catch(() => {});
    }
    setLobby(null);
    setLobbyCode(null);
  }

  return (
    <LobbyContext.Provider value={{
      playerId, playerName,
      lobbyCode, phase, players, settings, isHost, myRole, round,
      error, isLoading,
      createLobby, joinLobby, updateSettings,
      startGame, startDiscussion, revealResults, playAgain, leaveLobby,
    }}>
      {children}
    </LobbyContext.Provider>
  );
}

export function useLobby() {
  return useContext(LobbyContext);
}
