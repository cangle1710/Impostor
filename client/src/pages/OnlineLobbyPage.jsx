import { useState } from 'react';
import { useLobby } from '../context/LobbyContext.jsx';

export default function OnlineLobbyPage({ onBack }) {
  const { playerName, createLobby, joinLobby, error, isLoading } = useLobby();

  const [name, setName] = useState(playerName || '');
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [codeInput, setCodeInput] = useState('');

  async function handleCreate() {
    if (!name.trim()) return;
    await createLobby(name.trim());
  }

  async function handleJoin() {
    if (!name.trim() || codeInput.length !== 4) return;
    await joinLobby(codeInput.trim(), name.trim());
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-6 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 flex-1">

        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">Play Online</h1>
        </div>

        {/* Name input */}
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Your Name</p>
          <input
            type="text"
            maxLength={20}
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1e1640] border border-[#352a5e] rounded-xl px-4 py-3 text-white
              placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-base"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Mode selection */}
        {!mode && (
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={() => setMode('create')}
              disabled={!name.trim()}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-2xl text-base transition-colors active:scale-95"
            >
              Create a Lobby
            </button>
            <button
              onClick={() => setMode('join')}
              disabled={!name.trim()}
              className="w-full h-14 bg-[#1e1640] hover:bg-[#251c4a] disabled:opacity-40 border border-[#352a5e] hover:border-purple-600/50 text-white font-bold rounded-2xl text-base transition-colors active:scale-95"
            >
              Join a Lobby
            </button>
          </div>
        )}

        {/* Create */}
        {mode === 'create' && (
          <div className="flex flex-col gap-4">
            <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl px-4 py-4 text-center">
              <p className="text-purple-300 text-sm">A 4-digit code will be generated. Share it with your friends so they can join.</p>
            </div>
            <button
              onClick={handleCreate}
              disabled={isLoading || !name.trim()}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-2xl text-base transition-colors active:scale-95"
            >
              {isLoading ? 'Creating...' : 'Create Lobby'}
            </button>
            <button onClick={() => setMode(null)} className="text-gray-500 text-sm text-center">← Back</button>
          </div>
        )}

        {/* Join */}
        {mode === 'join' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Lobby Code</p>
              <input
                type="text"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="4-digit code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full bg-[#1e1640] border border-[#352a5e] rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-widest
                  placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={isLoading || !name.trim() || codeInput.length !== 4}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-2xl text-base transition-colors active:scale-95"
            >
              {isLoading ? 'Joining...' : 'Join Lobby'}
            </button>
            <button onClick={() => setMode(null)} className="text-gray-500 text-sm text-center">← Back</button>
          </div>
        )}

      </div>
    </div>
  );
}
