import { useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import VoteCard from '../components/VoteCard.jsx';

export default function VotingPage() {
  const { me, votingPlayers, votes, myRole, isHost, castVote, forceEndVoting } = useSocket();
  const [myVote, setMyVote] = useState(null);

  const othersToVote = votingPlayers.filter((p) => p.id !== me?.id && p.isConnected);
  const hasVoted = !!myVote;
  const totalVotes = Object.values(votes).reduce((s, c) => s + c, 0);
  const totalVoters = votingPlayers.filter((p) => p.isConnected).length;

  const handleVote = (targetId) => {
    if (hasVoted) return;
    setMyVote(targetId);
    castVote(targetId);
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Vote</h2>
          <p className="text-gray-400 text-sm mt-1">Who do you think is the impostor?</p>
        </div>

        {/* Vote progress */}
        <div className="bg-[#1e1640] border border-[#352a5e] rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-gray-400 text-sm">{totalVotes} of {totalVoters} votes cast</p>
          <div className="flex gap-1">
            {Array.from({ length: totalVoters }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < totalVotes ? 'bg-purple-500' : 'bg-[#352a5e]'}`} />
            ))}
          </div>
        </div>

        {/* Role reminder */}
        {myRole && (
          <div className={`px-3 py-2 rounded-xl border text-center
            ${myRole.role === 'IMPOSTOR' ? 'border-red-500/30 bg-red-500/10' : 'border-green-500/30 bg-green-500/10'}`}>
            <p className={`text-xs font-semibold ${myRole.role === 'IMPOSTOR' ? 'text-red-400' : 'text-green-400'}`}>
              {myRole.role === 'IMPOSTOR' ? 'You are the IMPOSTOR — vote strategically!' : 'You are a CREWMATE — find the impostor!'}
            </p>
          </div>
        )}

        {/* Voting grid */}
        {!hasVoted ? (
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Select who to vote for</p>
            <div className="grid grid-cols-2 gap-3">
              {othersToVote.map((p) => (
                <VoteCard
                  key={p.id}
                  player={p}
                  selected={false}
                  voteCount={votes[p.id] || 0}
                  hasVoted={false}
                  onVote={handleVote}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center">
              <p className="text-green-300 font-semibold">Vote cast!</p>
              <p className="text-gray-400 text-sm mt-0.5">
                You voted for <span className="text-white font-medium">
                  {votingPlayers.find((p) => p.id === myVote)?.name || '?'}
                </span>
              </p>
            </div>

            {/* Live vote counts */}
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Current votes</p>
              <div className="grid grid-cols-2 gap-3">
                {othersToVote.map((p) => (
                  <VoteCard
                    key={p.id}
                    player={p}
                    selected={p.id === myVote}
                    voteCount={votes[p.id] || 0}
                    hasVoted={true}
                    onVote={() => {}}
                  />
                ))}
              </div>
            </div>

            {totalVotes < totalVoters && (
              <p className="text-gray-500 text-sm text-center">
                Waiting for {totalVoters - totalVotes} more vote{totalVoters - totalVotes !== 1 ? 's' : ''}...
              </p>
            )}
          </div>
        )}

        {/* Host force end */}
        {isHost && (
          <button
            onClick={forceEndVoting}
            className="w-full h-11 border border-[#352a5e] hover:border-purple-600/50 text-gray-400 hover:text-gray-200 rounded-xl text-sm transition-all mt-2"
          >
            Force reveal results
          </button>
        )}
      </div>
    </div>
  );
}
