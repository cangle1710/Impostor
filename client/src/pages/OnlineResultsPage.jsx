import { useLobby } from '../context/LobbyContext.jsx';

export default function OnlineResultsPage() {
  const { round, settings, players, isHost, playAgain, leaveLobby } = useLobby();

  const results = round?.results;
  if (!results) return null;

  const { impostors, secret, accusation, impostorGuessCorrect, impostorGuess } = results;

  const crewmatesWon = accusation?.correct === true;
  const impostorSavedByGuess = crewmatesWon && impostorGuessCorrect;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">{crewmatesWon ? (impostorSavedByGuess ? '🤯' : '🎉') : '😈'}</div>
          <h2 className="text-3xl font-bold text-white">
            {impostorSavedByGuess
              ? 'Impostor Guessed It!'
              : crewmatesWon
                ? 'Crewmates Win!'
                : 'Impostors Survive!'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {impostorSavedByGuess
              ? 'Caught but guessed the word correctly!'
              : crewmatesWon
                ? `${accusation.accusedName} was correctly accused!`
                : "Here's what everyone was hiding"}
          </p>
        </div>

        {/* Impostor guess result */}
        {impostorGuess && (
          <div className={`border rounded-2xl px-4 py-3 text-center ${impostorGuessCorrect ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
            <p className={`font-semibold text-sm ${impostorGuessCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {impostorGuessCorrect ? 'Impostor guessed correctly!' : 'Impostor guessed wrong'}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">Guess: "{impostorGuess}"</p>
          </div>
        )}

        {/* Secret word / question */}
        {secret && (
          <div className="bg-purple-600/15 border-2 border-purple-500/50 rounded-2xl p-5 text-center">
            <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {settings?.gameMode === 'WORD' ? 'The Secret Word' : 'The Question (Crewmates)'}
            </p>
            <p className="text-2xl font-bold text-white">{secret}</p>
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

        {/* Players list with impostor highlights */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">All Players</p>
          <div className="flex flex-col gap-2">
            {players.map((p) => {
              const isImp = impostors?.some((imp) => imp.id === p.id);
              return (
                <div key={p.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${isImp ? 'bg-red-500/10' : 'bg-[#251c4a]'}`}>
                  <div className="w-8 h-8 rounded-full bg-[#352a5e] flex items-center justify-center text-sm font-bold text-purple-300 shrink-0">
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium text-white">{p.name}</span>
                  {isImp && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">impostor</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2">
          {isHost ? (
            <button
              onClick={playAgain}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
            >
              Play Again
            </button>
          ) : (
            <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl px-4 py-3 text-center">
              <p className="text-gray-400 text-sm">Waiting for host to start the next round...</p>
            </div>
          )}
          <button
            onClick={leaveLobby}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors text-center"
          >
            Leave Lobby
          </button>
        </div>

      </div>
    </div>
  );
}
