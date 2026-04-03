import { useState } from 'react';

function loadOrCreate() {
  try {
    const stored = localStorage.getItem('impostor_player');
    if (stored) return JSON.parse(stored);
  } catch {}
  const identity = { id: crypto.randomUUID(), name: '' };
  localStorage.setItem('impostor_player', JSON.stringify(identity));
  return identity;
}

export function usePlayerIdentity() {
  const [identity, setIdentity] = useState(loadOrCreate);

  function setName(name) {
    const updated = { ...identity, name };
    localStorage.setItem('impostor_player', JSON.stringify(updated));
    setIdentity(updated);
  }

  return { playerId: identity.id, playerName: identity.name, setName };
}
