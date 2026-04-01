import { useGame } from '../context/GameContext.jsx';

export default function ResultsPage() {
  const { results, settings, playAgain } = useGame();

  if (!results) return null;

  const { impostors, secret } = results;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">🔍</div>
          <h2 className="text-3xl font-bold text-white">Reveal</h2>
          <p className="text-gray-400 text-sm mt-1">Here's what everyone was hiding</p>
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

        {/* Impostors */}
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

        {/* Play Again */}
        <div className="pt-2">
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
