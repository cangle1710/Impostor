import { useState } from 'react';
import { useLobby } from '../context/LobbyContext.jsx';
import PlayerList from '../components/PlayerList.jsx';
import SettingsPanel from '../components/SettingsPanel.jsx';

export default function WaitingRoomPage() {
  const { lobbyCode, players, settings, isHost, playerId, updateSettings, startGame, leaveLobby } = useLobby();
  const [copied, setCopied] = useState(false);

  const canStart = players.length >= 3 && settings?.numImposters < players.length;

  function copyCode() {
    navigator.clipboard.writeText(lobbyCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-6 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-xl font-bold text-white">Waiting Room</h1>
          <button onClick={leaveLobby} className="text-gray-500 hover:text-red-400 text-sm transition-colors">
            Leave
          </button>
        </div>

        {/* Lobby code */}
        <button
          onClick={copyCode}
          className="bg-[#1e1640] border border-[#352a5e] rounded-2xl px-4 py-4 flex items-center justify-between active:scale-95 transition-transform"
        >
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Lobby Code</p>
            <p className="text-4xl font-bold text-purple-400 tracking-widest">{lobbyCode}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs mb-1">Share this code</p>
            <p className="text-sm font-medium text-purple-300">{copied ? 'Copied!' : 'Tap to copy'}</p>
          </div>
        </button>

        {/* Players */}
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Players ({players.length})
          </p>
          <PlayerList
            players={players.map((p) => ({ ...p, isConnected: true }))}
            myId={playerId}
            showStatus={false}
          />
          {players.length < 3 && (
            <p className="text-yellow-500/70 text-xs mt-2 text-center">
              Need at least {3 - players.length} more player{3 - players.length !== 1 ? 's' : ''} to start
            </p>
          )}
        </div>

        {/* Settings — host only */}
        {isHost && settings && (
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Settings</p>
            <SettingsPanel
              settings={settings}
              onChange={updateSettings}
              playerCount={players.length}
            />
          </div>
        )}

        {/* Non-host: waiting message */}
        {!isHost && (
          <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl px-4 py-4 text-center">
            <p className="text-gray-300 text-sm">Waiting for the host to start the game...</p>
          </div>
        )}

        {/* Start button — host only */}
        {isHost && (
          <div className="mt-auto pt-2">
            {!canStart && players.length >= 3 && (
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

      </div>
    </div>
  );
}
