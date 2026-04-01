import { useSocket } from '../context/SocketContext.jsx';
import RoleCard from '../components/RoleCard.jsx';

export default function RoleRevealPage() {
  const { me, players, revealState, myRole, settings, viewRole, confirmReady } = useSocket();

  if (!revealState) return null;

  const { nextPlayerId, revealedCount, totalCount } = revealState;
  const isMyTurn = nextPlayerId === me?.id;
  const nextPlayer = players.find((p) => p.id === nextPlayerId);
  const alreadyViewed = !!myRole;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 flex-1">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Role Reveal</h2>
          <p className="text-gray-400 mt-1 text-sm">Pass the phone around — each player views privately</p>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{revealedCount} of {totalCount} players revealed</span>
            <span>{totalCount - revealedCount} remaining</span>
          </div>
          <div className="h-2 bg-[#352a5e] rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${(revealedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        {isMyTurn ? (
          <div className="flex flex-col gap-4 flex-1">
            <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl px-4 py-3 text-center">
              <p className="text-purple-300 font-semibold">It's your turn, {me?.name}!</p>
              <p className="text-gray-400 text-xs mt-0.5">Make sure no one else can see your screen</p>
            </div>

            {!alreadyViewed ? (
              <>
                <button
                  onClick={viewRole}
                  className="w-full aspect-[3/4] max-h-72 rounded-2xl border-2 border-purple-600/50 bg-[#1e1640]
                    flex flex-col items-center justify-center gap-3 cursor-pointer
                    active:scale-95 transition-transform hover:border-purple-500 hover:bg-[#251c4a]"
                >
                  <div className="text-5xl">🔒</div>
                  <p className="text-purple-300 font-semibold text-lg">Tap to reveal</p>
                  <p className="text-gray-500 text-sm">Keep your screen private</p>
                </button>
              </>
            ) : (
              <>
                <RoleCard
                  role={myRole.role}
                  word={myRole.word}
                  question={myRole.question}
                  category={myRole.category}
                  hint={myRole.hint}
                  impostorPartners={myRole.impostorPartners}
                  gameMode={settings.gameMode}
                />
                <button
                  onClick={confirmReady}
                  className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
                >
                  Done — Pass the phone
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6 flex-1 text-center">
            <div className="w-24 h-24 rounded-full bg-[#1e1640] border-2 border-[#352a5e] flex items-center justify-center text-4xl">
              {nextPlayer?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white font-bold text-xl">
                {nextPlayer?.name || 'Next player'}'s turn
              </p>
              <p className="text-gray-400 mt-1">Pass the phone to them</p>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalCount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < revealedCount ? 'bg-purple-500' : 'bg-[#352a5e]'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
