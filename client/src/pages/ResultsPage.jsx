import { useGame } from '../context/GameContext.jsx';

export default function ResultsPage() {
  const { results, settings, players, scores, accusation, playAgain, resetScores } = useGame();

  if (!results) return null;

  const { impostors, secret, impostorGuessCorrect, impostorGuess } = results;

  const crewmatesWon = accusation?.correct === true;
  const impostorsWon = !crewmatesWon;

  const sortedScores = settings.trackScores
    ? [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
    : [];

  function handleResetAndPlay() {
    resetScores();
    playAgain();
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          {settings.allowAccusation ? (
            <>
              <div className="text-5xl mb-3">{crewmatesWon ? '🎉' : '😈'}</div>
              <h2 className="text-3xl font-bold text-white">
                {crewmatesWon ? 'Crewmates Win!' : 'Impostors Survive!'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {crewmatesWon
                  ? `${players.find((p) => p.id === accusation.accusedId)?.name} was correctly accused`
                  : 'No one was caught in time'}
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">🔍</div>
              <h2 className="text-3xl font-bold text-white">Reveal</h2>
              <p className="text-gray-400 text-sm mt-1">Here's what everyone was hiding</p>
            </>
          )}
        </div>

        {/* Secret word / question */}
        {secret && (
          <div className="bg-purple-600/15 border-2 border-purple-500/50 rounded-2xl p-5 text-center">
            <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {settings.gameMode === 'WORD' ? 'The Secret Word' : 'The Question (Crewmates)'}
            </p>
            <p className="text-2xl font-bold text-white">{secret}</p>
          </div>
        )}

        {/* Impostor word guess result */}
        {settings.allowImpostorGuess && impostorGuess && (
          <div className={`border rounded-2xl p-4 text-center ${impostorGuessCorrect
            ? 'bg-yellow-500/10 border-yellow-500/40'
            : 'bg-gray-800 border-gray-700'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${impostorGuessCorrect ? 'text-yellow-400' : 'text-gray-500'}`}>
              Impostor's Word Guess
            </p>
            <p className={`text-lg font-bold ${impostorGuessCorrect ? 'text-yellow-300' : 'text-gray-400 line-through'}`}>
              {impostorGuess}
            </p>
            <p className={`text-sm mt-1 ${impostorGuessCorrect ? 'text-yellow-400 font-semibold' : 'text-gray-500'}`}>
              {impostorGuessCorrect ? '✓ Correct! Impostor gets a bonus point' : '✗ Wrong guess'}
            </p>
          </div>
        )}

        {/* Impostors list */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            {impostors?.length === 1 ? 'The Impostor' : `The Impostors (${impostors?.length})`}
          </p>
          <div className="flex flex-col gap-2">
            {impostors?.map((imp) => (
              <div key={imp.id} className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-red-500/30 border border-red-500/50 flex items-center justify-center text-base font-bold text-red-300">
                  {imp.name[0].toUpperCase()}
                </div>
                <span className="font-semibold text-white text-lg">{imp.name}</span>
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">IMPOSTOR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score table */}
        {settings.trackScores && sortedScores.length > 0 && (
          <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Session Scores</p>
            <div className="flex flex-col gap-1.5">
              {sortedScores.map((p, i) => {
                const pts = scores[p.id] || 0;
                const isImp = impostors.some((imp) => imp.id === p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2 bg-[#251c4a]">
                    <span className="text-gray-500 text-sm w-5">{i + 1}.</span>
                    <span className="flex-1 text-sm font-medium text-white">{p.name}</span>
                    {isImp && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">impostor</span>}
                    <span className="text-purple-300 font-bold text-base">{pts}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Play Again / Reset */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={playAgain}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
          >
            Play Again
          </button>
          {settings.trackScores && (
            <button
              onClick={handleResetAndPlay}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors text-center"
            >
              Reset Scores &amp; Play Again
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
