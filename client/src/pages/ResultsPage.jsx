import { useGame } from '../context/GameContext.jsx';

export default function ResultsPage() {
  const { results, players, playAgain } = useGame();

  if (!results) return null;

  const { caught, eliminated, impostors, secret, votes, tie, impostorGuessedCorrectly, guesserName } = results;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Outcome Banner */}
        {impostorGuessedCorrectly ? (
          <div className="rounded-2xl bg-red-500/20 border-2 border-red-500 p-5 text-center">
            <div className="text-5xl mb-2">😈</div>
            <h2 className="text-2xl font-bold text-red-300">Impostors Win!</h2>
            <p className="text-gray-300 mt-1 text-sm">
              <span className="text-white font-semibold">{guesserName}</span> correctly guessed the secret word!
            </p>
          </div>
        ) : tie ? (
          <div className="rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/50 p-5 text-center">
            <div className="text-5xl mb-2">🤝</div>
            <h2 className="text-2xl font-bold text-yellow-300">It's a Tie!</h2>
            <p className="text-gray-400 mt-1 text-sm">No one was eliminated — the impostors escape!</p>
          </div>
        ) : caught ? (
          <div className="rounded-2xl bg-green-500/20 border-2 border-green-500 p-5 text-center">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-green-300">Crewmates Win!</h2>
            {eliminated && (
              <p className="text-gray-300 mt-1 text-sm">
                <span className="text-white font-semibold">{eliminated.name}</span> was the impostor!
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-red-500/20 border-2 border-red-500 p-5 text-center">
            <div className="text-5xl mb-2">😈</div>
            <h2 className="text-2xl font-bold text-red-300">Impostors Win!</h2>
            {eliminated ? (
              <p className="text-gray-400 mt-1 text-sm">
                The group voted out <span className="text-white font-semibold">{eliminated.name}</span> — but they were innocent!
              </p>
            ) : (
              <p className="text-gray-400 mt-1 text-sm">The impostors blended in perfectly!</p>
            )}
          </div>
        )}

        {/* Secret reveal */}
        {secret && (
          <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4 text-center">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              The Secret Was
            </p>
            <p className="text-2xl font-bold text-purple-300">{secret}</p>
          </div>
        )}

        {/* Impostors */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Impostors ({impostors?.length || 0})
          </p>
          <div className="flex flex-col gap-2">
            {impostors?.map((imp) => (
              <div key={imp.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-sm font-bold text-red-300">
                  {imp.name[0].toUpperCase()}
                </div>
                <span className="font-medium">{imp.name}</span>
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">IMPOSTOR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vote tally */}
        {votes && Object.keys(votes).length > 0 && (
          <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Vote Tally</p>
            <div className="flex flex-col gap-2">
              {Object.entries(votes)
                .sort((a, b) => b[1] - a[1])
                .map(([targetId, count]) => {
                  const p = players.find((pl) => pl.id === targetId);
                  if (!p) return null;
                  const isImp = impostors?.some((i) => i.id === targetId);
                  const isElim = eliminated?.id === targetId;
                  return (
                    <div key={targetId} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#352a5e] flex items-center justify-center text-sm font-bold text-gray-300">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="flex-1 font-medium text-sm">{p.name}</span>
                      {isImp && <span className="text-xs text-red-400">impostor</span>}
                      {isElim && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">eliminated</span>}
                      <span className="text-purple-300 font-bold">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={playAgain}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
