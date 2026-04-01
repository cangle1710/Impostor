import { useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import Timer from '../components/Timer.jsx';
import PlayerList from '../components/PlayerList.jsx';

export default function DiscussionPage() {
  const { players, discussion, myRole, settings, me, isHost, skipDiscussion, impostorGuess } = useSocket();
  const [showGuess, setShowGuess] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessResult, setGuessResult] = useState(null);

  if (!discussion) return null;

  const isImpostor = myRole?.role === 'IMPOSTOR';
  const canGuess = isImpostor && settings.allowImpostorGuess && settings.gameMode === 'WORD';

  const handleGuess = () => {
    if (!guess.trim()) return;
    impostorGuess(guess.trim());
    setGuessResult('pending');
    setGuess('');
    setShowGuess(false);
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Discussion</h2>
          <p className="text-gray-400 text-sm mt-1">
            {settings.gameMode === 'WORD'
              ? 'Ask each other questions to find who doesn\'t know the secret word'
              : 'Ask questions to find who got a different question'}
          </p>
        </div>

        {/* Timer */}
        <div className="flex justify-center py-2">
          <Timer endsAt={discussion.discussionEndsAt} />
        </div>

        {/* Role reminder */}
        {myRole && (
          <div className={`px-4 py-3 rounded-xl border text-center
            ${isImpostor
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-green-500/30 bg-green-500/10'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1
              ${isImpostor ? 'text-red-400' : 'text-green-400'}`}>
              You are the {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}
            </p>
            {settings.gameMode === 'WORD' && !isImpostor && myRole.word && (
              <p className="text-white font-bold">{myRole.word}</p>
            )}
            {settings.gameMode === 'WORD' && isImpostor && (
              <p className="text-gray-400 text-sm">Blend in — you don't know the word!</p>
            )}
            {settings.gameMode === 'QUESTION' && myRole.question && (
              <p className="text-gray-300 text-sm italic">"{myRole.question}"</p>
            )}
          </div>
        )}

        {/* Impostor guess */}
        {canGuess && (
          <div>
            {guessResult === 'pending' ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-center">
                <p className="text-yellow-300 text-sm">Guess submitted — waiting for result...</p>
              </div>
            ) : showGuess ? (
              <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-gray-300 text-sm font-medium">Guess the secret word to win instantly:</p>
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                  placeholder="Your guess..."
                  className="bg-[#251c4a] border border-[#352a5e] rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowGuess(false)} className="flex-1 h-10 bg-[#352a5e] rounded-xl text-gray-300 text-sm">Cancel</button>
                  <button onClick={handleGuess} disabled={!guess.trim()} className="flex-1 h-10 bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-xl text-white font-semibold text-sm">
                    Guess!
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowGuess(true)}
                className="w-full h-11 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
              >
                🎯 Guess the secret word (impostor special)
              </button>
            )}
          </div>
        )}

        {/* Players */}
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Players</p>
          <PlayerList players={players} myId={me?.id} />
        </div>

        {/* Host skip */}
        {isHost && (
          <button
            onClick={skipDiscussion}
            className="w-full h-11 border border-[#352a5e] hover:border-purple-600/50 text-gray-400 hover:text-gray-200 rounded-xl text-sm transition-all"
          >
            Skip to voting →
          </button>
        )}
      </div>
    </div>
  );
}
