import { useLobby } from '../context/LobbyContext.jsx';
import Timer from '../components/Timer.jsx';

export default function OnlineDiscussionPage() {
  const { settings, round, isHost, revealResults, leaveLobby } = useLobby();

  const endsAt = round?.discussionEndsAt ?? null;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={leaveLobby} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Leave
          </button>
          <h2 className="text-2xl font-bold text-white">Discussion</h2>
          <div className="w-12" />
        </div>
        <p className="text-gray-400 text-sm text-center -mt-2">
          {settings?.gameMode === 'WORD'
            ? "Discuss and figure out who doesn't know the secret word"
            : 'Ask each other questions — find who got a different one'}
        </p>

        {/* Timer */}
        {endsAt && (
          <div className="flex justify-center py-4">
            <Timer
              endsAt={endsAt}
              totalSeconds={settings?.discussionSeconds ?? 180}
              onExpire={isHost ? revealResults : undefined}
            />
          </div>
        )}

        {/* Tips */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-gray-300 text-sm font-semibold">Tips</p>
          <ul className="flex flex-col gap-1.5 text-sm text-gray-400">
            <li>• Ask each player questions about the {settings?.gameMode === 'WORD' ? 'word' : 'topic'}</li>
            <li>• Watch for vague or inconsistent answers</li>
            <li>• Impostors: blend in and misdirect!</li>
            {settings?.chaosMode && (
              <li>• Nobody knows how many impostors are among you</li>
            )}
          </ul>
        </div>

        {/* Host-only: reveal button */}
        {isHost && (
          <div className="mt-auto pt-2">
            <button
              onClick={revealResults}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
            >
              Reveal Results →
            </button>
          </div>
        )}

        {/* Non-host: waiting */}
        {!isHost && (
          <div className="mt-auto pt-2 bg-[#1e1640] border border-[#352a5e] rounded-2xl px-4 py-3 text-center">
            <p className="text-gray-400 text-sm">Waiting for host to reveal results...</p>
          </div>
        )}

      </div>
    </div>
  );
}
