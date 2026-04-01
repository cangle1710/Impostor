import { useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

export default function HomePage() {
  const { createRoom, joinRoom, error, clearError } = useSocket();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    setLoading(true);
    createRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || code.length !== 4) return;
    setLoading(true);
    joinRoom(name.trim(), code);
  };

  // Reset loading on error
  if (error && loading) setLoading(false);

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Logo / Header */}
        <div className="text-center">
          <div className="text-6xl mb-3">🕵️</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Impostor</h1>
          <p className="text-gray-400 mt-1">Free party game — no account needed</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={clearError} className="text-red-400 ml-3 font-bold">✕</button>
          </div>
        )}

        {/* Name input */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-sm font-medium">Your name</label>
          <input
            type="text"
            maxLength={20}
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && mode === 'create') handleCreate(); }}
            className="w-full bg-[#1e1640] border border-[#352a5e] rounded-xl px-4 py-3.5 text-white placeholder-gray-600
              focus:outline-none focus:border-purple-500 transition-colors text-base"
          />
        </div>

        {/* Mode: none selected */}
        {!mode && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode('create')}
              disabled={!name.trim()}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed
                text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              disabled={!name.trim()}
              className="w-full h-14 bg-[#1e1640] hover:bg-[#251c4a] disabled:opacity-40 disabled:cursor-not-allowed
                border border-[#352a5e] hover:border-purple-600/50 text-white font-bold rounded-2xl text-lg transition-all active:scale-95"
            >
              Join Room
            </button>
          </div>
        )}

        {/* Create mode */}
        {mode === 'create' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-40
                text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            <button onClick={() => { setMode(null); clearError(); }} className="text-gray-500 text-sm text-center">
              ← Back
            </button>
          </div>
        )}

        {/* Join mode */}
        {mode === 'join' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-sm font-medium">Room code</label>
              <input
                type="text"
                maxLength={4}
                placeholder="4-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
                className="w-full bg-[#1e1640] border border-[#352a5e] rounded-xl px-4 py-3.5 text-white placeholder-gray-600
                  focus:outline-none focus:border-purple-500 transition-colors text-base text-center text-2xl tracking-[0.4em] font-bold"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={!name.trim() || code.length !== 4 || loading}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-40
                text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
            <button onClick={() => { setMode(null); setCode(''); clearError(); }} className="text-gray-500 text-sm text-center">
              ← Back
            </button>
          </div>
        )}

        {/* How to play */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">How to Play</p>
          <div className="flex flex-col gap-2 text-sm text-gray-300">
            <p>1. Create a room and share the 4-digit code with friends</p>
            <p>2. Each player gets a secret word — except the impostors!</p>
            <p>3. Discuss and try to find who doesn't know the word</p>
            <p>4. Vote — catch the impostors to win!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
