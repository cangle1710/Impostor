import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import SettingsPanel from '../components/SettingsPanel.jsx';

export default function SetupPage({ onExit }) {
  const { players, settings, addPlayer, removePlayer, updateSettings, startGame } = useGame();
  const [nameInput, setNameInput] = useState('');

  const handleAdd = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    addPlayer(trimmed);
    setNameInput('');
  };

  const canStart = players.length >= 3 && settings.numImposters < players.length;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-6 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5 flex-1">

        {/* Header */}
        <div className="text-center pt-2">
          {onExit && (
            <div className="flex justify-start mb-2">
              <button onClick={onExit} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                ← Back
              </button>
            </div>
          )}
          <div className="text-5xl mb-2">🕵️</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Impostor</h1>
          <p className="text-gray-400 text-sm mt-1">Pass the phone — everyone plays together</p>
        </div>

        {/* Add players */}
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Players ({players.length})
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={20}
              placeholder="Player name..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              className="flex-1 bg-[#1e1640] border border-[#352a5e] rounded-xl px-4 py-3 text-white
                placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-base"
            />
            <button
              onClick={handleAdd}
              disabled={!nameInput.trim()}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40
                text-white font-bold rounded-xl transition-colors active:scale-95"
            >
              Add
            </button>
          </div>

          {/* Player list */}
          {players.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {players.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 bg-[#1e1640] border border-[#352a5e] rounded-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-[#352a5e] flex items-center justify-center text-sm font-bold text-purple-300 shrink-0">
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="flex-1 font-medium truncate">{p.name}</span>
                  <button
                    onClick={() => removePlayer(p.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {players.length < 3 && (
            <p className="text-yellow-500/70 text-xs mt-2 text-center">
              Add at least {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''} to start
            </p>
          )}
        </div>

        {/* Settings */}
        {players.length >= 2 && (
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Settings</p>
            <SettingsPanel
              settings={settings}
              onChange={updateSettings}
              playerCount={players.length}
            />
          </div>
        )}

        {/* Start */}
        <div className="mt-auto pt-2">
          {!canStart && players.length >= 3 && (
            <p className="text-yellow-500/80 text-xs text-center mb-2">
              Too many impostors for this player count
            </p>
          )}
          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
          >
            Start Game
          </button>
        </div>

        {/* How to play */}
        {players.length === 0 && (
          <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">How to Play</p>
            <div className="flex flex-col gap-2 text-sm text-gray-300">
              <p>1. Add everyone's name, then tap Start</p>
              <p>2. Pass the phone — each player secretly views their role</p>
              <p>3. Discuss and figure out who doesn't know the word</p>
              <p>4. Vote — catch the impostors to win!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
