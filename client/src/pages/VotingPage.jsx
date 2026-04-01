import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import VoteCard from '../components/VoteCard.jsx';

export default function VotingPage() {
  const { players, votes, settings, round, rolesByPlayer, castVote, showResults } = useGame();
  const [voterIndex, setVoterIndex] = useState(0);
  const [currentVote, setCurrentVote] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const currentVoter = players[voterIndex];
  const isLastVoter = voterIndex === players.length - 1;
  const isImpostor = round?.impostorIds.includes(currentVoter?.id);
  const canGuess = isImpostor && settings.allowImpostorGuess && settings.gameMode === 'WORD';

  const [showGuess, setShowGuess] = useState(false);
  const [guess, setGuess] = useState('');

  const othersToVote = players.filter((p) => p.id !== currentVoter?.id);

  const handleVoteSelect = (targetId) => {
    if (confirmed) return;
    setCurrentVote(targetId);
  };

  const handleConfirmVote = () => {
    if (!currentVote) return;
    castVote(currentVote);
    setConfirmed(true);
  };

  const handleNext = () => {
    if (isLastVoter) {
      showResults();
    } else {
      setVoterIndex((i) => i + 1);
      setCurrentVote(null);
      setConfirmed(false);
      setShowGuess(false);
      setGuess('');
    }
  };

  const handleGuessSubmit = () => {
    if (!guess.trim()) return;
    const correct = guess.trim().toLowerCase() === round.word?.toLowerCase();
    if (correct) {
      // Impostor wins — go straight to results with special flag
      // Import impostorGuessWin from context
      guessWin();
    } else {
      // Wrong guess — just dismiss and continue
      setShowGuess(false);
      setGuess('');
    }
  };

  // Need to call impostorGuessWin from context — access it from useGame
  const { impostorGuessWin } = useGame();
  const guessWin = () => impostorGuessWin(currentVoter?.name);

  if (!currentVoter) return null;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Vote</h2>
          <p className="text-gray-400 text-sm mt-1">
            Player {voterIndex + 1} of {players.length}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center">
          {players.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors
                ${i < voterIndex ? 'bg-purple-500' : i === voterIndex ? 'bg-purple-400' : 'bg-[#352a5e]'}`}
            />
          ))}
        </div>

        {/* Current voter label */}
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl px-4 py-3 text-center">
          <p className="text-purple-300 font-semibold">{currentVoter.name}'s vote</p>
          <p className="text-gray-500 text-xs mt-0.5">Pass the phone to {currentVoter.name}</p>
        </div>

        {/* Impostor guess option */}
        {canGuess && !confirmed && (
          <div>
            {showGuess ? (
              <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-gray-300 text-sm font-medium">Guess the secret word to win instantly:</p>
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuessSubmit()}
                  placeholder="Your guess..."
                  className="bg-[#251c4a] border border-[#352a5e] rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowGuess(false)} className="flex-1 h-10 bg-[#352a5e] rounded-xl text-gray-300 text-sm">Cancel</button>
                  <button onClick={handleGuessSubmit} disabled={!guess.trim()} className="flex-1 h-10 bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-xl text-white font-semibold text-sm">
                    Guess!
                  </button>
                </div>
                <p className="text-gray-500 text-xs text-center">Wrong guess = nothing happens, you continue voting</p>
              </div>
            ) : (
              <button
                onClick={() => setShowGuess(true)}
                className="w-full h-11 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
              >
                🎯 Guess the secret word (impostor only)
              </button>
            )}
          </div>
        )}

        {/* Vote grid */}
        {!confirmed ? (
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Who is the impostor?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {othersToVote.map((p) => (
                <VoteCard
                  key={p.id}
                  player={p}
                  selected={currentVote === p.id}
                  voteCount={0}
                  hasVoted={false}
                  onVote={handleVoteSelect}
                />
              ))}
            </div>
            <button
              onClick={handleConfirmVote}
              disabled={!currentVote}
              className="w-full h-12 mt-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors active:scale-95"
            >
              Confirm Vote
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center">
              <p className="text-green-300 font-semibold">Vote locked in!</p>
              <p className="text-gray-400 text-sm mt-0.5">
                {currentVoter.name} voted for{' '}
                <span className="text-white font-medium">
                  {players.find((p) => p.id === currentVote)?.name}
                </span>
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
            >
              {isLastVoter ? 'See Results →' : 'Next Player →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
