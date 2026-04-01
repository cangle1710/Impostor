import { useGame } from '../context/GameContext.jsx';
import RoleCard from '../components/RoleCard.jsx';

export default function RoleRevealPage() {
  const {
    players, round, revealIndex, rolesByPlayer, settings,
    currentRevealPlayerId, allRevealed,
    advanceReveal, startDiscussion,
  } = useGame();

  if (!round) return null;

  const totalCount = round.revealOrder.length;
  const revealedCount = revealIndex;
  const currentPlayer = players.find((p) => p.id === currentRevealPlayerId);

  if (allRevealed) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8 safe-pt safe-pb">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <div className="text-6xl">✅</div>
          <div>
            <h2 className="text-2xl font-bold text-white">Everyone's ready!</h2>
            <p className="text-gray-400 mt-1 text-sm">All players have seen their roles. Time to discuss.</p>
          </div>
          <button
            onClick={startDiscussion}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
          >
            Start Discussion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 flex-1">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Role Reveal</h2>
          <p className="text-gray-400 mt-1 text-sm">Pass the phone — each player views privately</p>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{revealedCount} of {totalCount} revealed</span>
            <span>{totalCount - revealedCount} remaining</span>
          </div>
          <div className="h-2 bg-[#352a5e] rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (revealedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Current player prompt */}
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl px-4 py-3 text-center">
          <p className="text-purple-300 font-semibold text-lg">{currentPlayer?.name}'s turn</p>
          <p className="text-gray-400 text-xs mt-0.5">Make sure no one else can see your screen</p>
        </div>

        {/* Role card for this player */}
        <div className="flex-1">
          <RoleCard
            key={currentRevealPlayerId}
            rolePayload={rolesByPlayer[currentRevealPlayerId]}
            gameMode={settings.gameMode}
            onDone={advanceReveal}
          />
        </div>
      </div>
    </div>
  );
}
