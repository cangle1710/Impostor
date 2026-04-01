export default function PlayerList({ players, myId, showStatus = false, badge = null }) {
  return (
    <div className="flex flex-col gap-2">
      {players.map((p) => (
        <div
          key={p.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border
            ${p.id === myId ? 'border-purple-600 bg-purple-600/10' : 'border-[#352a5e] bg-[#1e1640]'}
            ${!p.isConnected ? 'opacity-40' : ''}`}
        >
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#352a5e] flex items-center justify-center text-sm font-bold text-purple-300 shrink-0">
            {p.name[0].toUpperCase()}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <span className="font-medium truncate block">
              {p.name}
              {p.id === myId && <span className="text-purple-400 text-xs ml-1">(you)</span>}
            </span>
            {!p.isConnected && (
              <span className="text-xs text-gray-500">disconnected</span>
            )}
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-2 shrink-0">
            {p.isHost && (
              <span className="text-yellow-400 text-xs font-semibold bg-yellow-400/10 px-2 py-0.5 rounded-full">
                HOST
              </span>
            )}
            {badge && badge(p)}
            {showStatus && (
              <span className={`w-2 h-2 rounded-full ${p.isConnected ? 'bg-green-400' : 'bg-gray-600'}`} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
