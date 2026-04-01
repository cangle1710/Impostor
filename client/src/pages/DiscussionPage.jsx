import { useGame } from '../context/GameContext.jsx';
import Timer from '../components/Timer.jsx';

export default function DiscussionPage() {
  const { settings, discussionEndsAt, startVoting } = useGame();

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Discussion</h2>
          <p className="text-gray-400 text-sm mt-1">
            {settings.gameMode === 'WORD'
              ? "Discuss and figure out who doesn't know the secret word"
              : 'Ask each other questions — find who got a different one'}
          </p>
        </div>

        {/* Timer */}
        <div className="flex justify-center py-4">
          <Timer
            endsAt={discussionEndsAt}
            totalSeconds={settings.discussionSeconds}
            onExpire={startVoting}
          />
        </div>

        {/* Reminder card */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-gray-300 text-sm font-semibold">Tips</p>
          <ul className="flex flex-col gap-1.5 text-sm text-gray-400">
            <li>• Ask each player questions about the {settings.gameMode === 'WORD' ? 'word' : 'topic'}</li>
            <li>• Watch for vague or inconsistent answers</li>
            <li>• Impostors: blend in and misdirect!</li>
          </ul>
        </div>

        {/* Skip to voting */}
        <div className="mt-auto pt-2">
          <button
            onClick={startVoting}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
          >
            Start Voting →
          </button>
        </div>
      </div>
    </div>
  );
}
