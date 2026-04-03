export default function LandingPage({ onSelect }) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-3">🕵️</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Impostor</h1>
          <p className="text-gray-400 text-sm mt-2">How do you want to play?</p>
        </div>

        {/* Mode buttons */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => onSelect('online')}
            className="w-full flex flex-col items-center gap-1 py-5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-colors active:scale-95 text-left"
          >
            <span className="text-lg w-full">Play Online</span>
            <span className="text-purple-200 text-sm font-normal w-full">Each friend joins on their own phone</span>
          </button>

          <button
            onClick={() => onSelect('local')}
            className="w-full flex flex-col items-center gap-1 py-5 px-6 bg-[#1e1640] hover:bg-[#251c4a] border border-[#352a5e] hover:border-purple-600/50 text-white font-bold rounded-2xl transition-colors active:scale-95 text-left"
          >
            <span className="text-lg w-full">Play Locally</span>
            <span className="text-gray-400 text-sm font-normal w-full">Pass one phone around the group</span>
          </button>
        </div>

      </div>
    </div>
  );
}
