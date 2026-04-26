import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import Timer from '../components/Timer.jsx';

export default function DiscussionPage() {
  const {
    players, settings, discussionEndsAt,
    accusation, revealResults, accuse, submitImpostorGuess,
  } = useGame();

  const [showAccuseModal, setShowAccuseModal] = useState(false);
  const [showGuessForm, setShowGuessForm] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const accusationDone = accusation !== null; // one attempt used (right or wrong)

  function handleAccuse(playerId) {
    setShowAccuseModal(false);
    accuse(playerId);
    // If correct, context transitions phase automatically — nothing else needed here
  }

  function handleGuessSubmit(e) {
    e.preventDefault();
    if (!guessInput.trim()) return;
    submitImpostorGuess(guessInput.trim());
    setGuessSubmitted(true);
    setShowGuessForm(false);
  }

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
          />
        </div>

        {/* Wrong accusation banner */}
        {accusation && !accusation.correct && (
          <div className="bg-orange-500/10 border border-orange-500/40 rounded-2xl px-4 py-3 text-center">
            <p className="text-orange-300 font-semibold text-sm">
              Wrong! {players.find((p) => p.id === accusation.accusedId)?.name} is innocent.
            </p>
            <p className="text-gray-400 text-xs mt-0.5">No more accusations — keep discussing!</p>
          </div>
        )}

        {/* Impostor guess confirmed */}
        {guessSubmitted && (
          <div className="bg-purple-500/10 border border-purple-500/40 rounded-2xl px-4 py-3 text-center">
            <p className="text-purple-300 font-semibold text-sm">Guess locked in!</p>
            <p className="text-gray-400 text-xs mt-0.5">The result will show when results are revealed.</p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-gray-300 text-sm font-semibold">Tips</p>
          <ul className="flex flex-col gap-1.5 text-sm text-gray-400">
            <li>• Ask each player questions about the {settings.gameMode === 'WORD' ? 'word' : 'topic'}</li>
            <li>• Watch for vague or inconsistent answers</li>
            <li>• Impostors: blend in and misdirect!</li>
            {settings.chaosMode && (
              <li>• Nobody knows how many impostors are among you</li>
            )}
            {settings.allowImpostorGuess && (
              <li>• Impostors can secretly guess the word to win even if caught</li>
            )}
          </ul>
        </div>

        {/* Optional: Accusation */}
        {settings.allowAccusation && (
          <button
            onClick={() => setShowAccuseModal(true)}
            disabled={accusationDone}
            className={`w-full h-12 rounded-2xl font-semibold text-sm border-2 transition-colors
              ${accusationDone
                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                : 'border-orange-500/60 text-orange-300 hover:bg-orange-500/10 active:scale-95'}`}
          >
            {accusationDone ? 'Accusation used' : '🫵 Accuse Someone'}
          </button>
        )}

        {/* Optional: Impostor guess */}
        {settings.allowImpostorGuess && !guessSubmitted && (
          showGuessForm ? (
            <form onSubmit={handleGuessSubmit} className="bg-[#1e1640] border border-purple-500/40 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-purple-300 text-sm font-semibold">Impostor's word guess</p>
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type the secret word..."
                autoFocus
                className="bg-[#251c4a] border border-[#352a5e] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowGuessForm(false)} className="flex-1 h-10 rounded-xl bg-[#352a5e] text-gray-300 text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold">Lock In Guess</button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowGuessForm(true)}
              className="text-purple-400 text-sm hover:text-purple-300 transition-colors text-center"
            >
              🎯 Impostor: I know the word...
            </button>
          )
        )}

        {/* Reveal */}
        <div className="mt-auto pt-2">
          <button
            onClick={revealResults}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
          >
            Reveal Results →
          </button>
        </div>
      </div>

      {/* Accuse modal overlay */}
      {showAccuseModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 pb-8 px-4"
          onClick={() => setShowAccuseModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1e1640] border border-[#352a5e] rounded-2xl p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-semibold text-center">Who is the impostor?</p>
            <p className="text-gray-400 text-xs text-center -mt-1">Choose carefully — you only get one try</p>
            <div className="flex flex-col gap-2 mt-1">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAccuse(p.id)}
                  className="w-full h-12 bg-[#251c4a] hover:bg-red-500/20 border border-[#352a5e] hover:border-red-500/50 rounded-xl text-white font-medium transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAccuseModal(false)} className="text-gray-500 text-sm text-center mt-1">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
