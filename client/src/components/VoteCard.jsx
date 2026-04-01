export default function VoteCard({ player, selected, voteCount, hasVoted, onVote }) {
  return (
    <button
      onClick={() => !hasVoted && onVote(player.id)}
      disabled={hasVoted}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all
        ${selected
          ? 'border-purple-500 bg-purple-600/20 scale-105'
          : 'border-[#352a5e] bg-[#1e1640] hover:border-purple-600/50'}
        ${hasVoted ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
        ${selected ? 'bg-purple-600 text-white' : 'bg-[#352a5e] text-purple-300'}`}>
        {player.name[0].toUpperCase()}
      </div>

      <p className="font-medium text-sm text-center truncate w-full">{player.name}</p>

      {voteCount > 0 && (
        <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full">
          {voteCount} vote{voteCount !== 1 ? 's' : ''}
        </span>
      )}
    </button>
  );
}
