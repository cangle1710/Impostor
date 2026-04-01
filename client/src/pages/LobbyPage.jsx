import { useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import PlayerList from '../components/PlayerList.jsx';
import SettingsPanel from '../components/SettingsPanel.jsx';

export default function LobbyPage() {
  const { roomCode, players, settings, me, isHost, updateSettings, startGame, leaveRoom, error, clearError } = useSocket();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const connectedCount = players.filter((p) => p.isConnected).length;
  const canStart = isHost && connectedCount >= 2 && settings.numImposters < connectedCount;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-6 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={leaveRoom} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Leave
          </button>
          <h2 className="text-lg font-bold">Lobby</h2>
          <div className="w-12" />
        </div>

        {/* Room Code */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold tracking-[0.2em] text-purple-400">{roomCode}</span>
            <button
              onClick={handleCopy}
              className="text-sm bg-[#352a5e] hover:bg-[#3d3270] text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">Share this code with friends</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={clearError} className="text-red-400 ml-3 font-bold">✕</button>
          </div>
        )}

        {/* Players */}
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Players ({connectedCount})
          </p>
          <PlayerList players={players} myId={me?.id} showStatus />
        </div>

        {/* Settings */}
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Settings</p>
          <SettingsPanel
            settings={settings}
            onChange={updateSettings}
            disabled={!isHost}
            playerCount={connectedCount}
          />
          {!isHost && (
            <p className="text-gray-500 text-xs text-center mt-2">Only the host can change settings</p>
          )}
        </div>

        {/* Start Button */}
        {isHost && (
          <div className="mt-auto pt-2">
            {!canStart && connectedCount < 2 && (
              <p className="text-yellow-500/80 text-xs text-center mb-2">Waiting for more players to join...</p>
            )}
            {!canStart && connectedCount >= 2 && settings.numImposters >= connectedCount && (
              <p className="text-yellow-500/80 text-xs text-center mb-2">Too many impostors for this player count</p>
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
        )}

        {!isHost && (
          <div className="mt-auto pt-2">
            <div className="w-full h-14 border border-[#352a5e] rounded-2xl flex items-center justify-center">
              <p className="text-gray-400 text-sm">Waiting for host to start...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
