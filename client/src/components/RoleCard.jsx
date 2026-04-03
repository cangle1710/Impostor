import { useState, useEffect } from 'react';

export default function RoleCard({ rolePayload, gameMode, onDone, doneLabel = 'Done — Pass the phone' }) {
  const [revealed, setRevealed] = useState(false);
  const [autoHiding, setAutoHiding] = useState(false);

  const role = rolePayload?.role;
  const isImpostor = role === 'IMPOSTOR';

  // Reset when player changes
  useEffect(() => {
    setRevealed(false);
    setAutoHiding(false);
  }, [rolePayload]);

  // Auto-hide after 12 seconds
  useEffect(() => {
    if (!revealed) return;
    const hideTimer = setTimeout(() => {
      setAutoHiding(true);
      setTimeout(() => setRevealed(false), 500);
    }, 12000);
    return () => clearTimeout(hideTimer);
  }, [revealed]);

  if (!revealed) {
    return (
      <button
        onClick={() => { setRevealed(true); setAutoHiding(false); }}
        className="w-full aspect-[3/4] max-h-72 rounded-2xl border-2 border-purple-600/50 bg-[#1e1640]
          flex flex-col items-center justify-center gap-3 cursor-pointer
          active:scale-95 transition-transform hover:border-purple-500 hover:bg-[#251c4a]"
      >
        <div className="text-5xl">🔒</div>
        <p className="text-purple-300 font-semibold text-lg">Tap to reveal</p>
        <p className="text-gray-500 text-sm">Keep your screen private</p>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`w-full rounded-2xl border-2 p-5 flex flex-col gap-4 transition-opacity duration-500
          ${isImpostor ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'}
          ${autoHiding ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Role badge */}
        <div className={`self-start px-4 py-1.5 rounded-full font-bold text-sm tracking-wide
          ${isImpostor ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}
        </div>

        {gameMode === 'WORD' ? (
          <>
            {isImpostor ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-1">Your secret word</p>
                <p className="text-2xl font-bold text-red-300">??? (You don't know)</p>
                <p className="text-gray-400 text-sm mt-3">Blend in — listen and act like you know!</p>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-gray-400 text-sm mb-1">Secret word</p>
                <p className="text-3xl font-bold text-green-300">{rolePayload.word}</p>
              </div>
            )}

            {rolePayload.roleName && (
              <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-3">
                <p className="text-xs text-green-500 mb-0.5">Your Role</p>
                <p className="text-green-200 font-semibold">{rolePayload.roleName}</p>
              </div>
            )}

            {rolePayload.category && (
              <div className="bg-[#1e1640] rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Category</p>
                <p className="text-purple-300 font-semibold">{rolePayload.category}</p>
              </div>
            )}

            {rolePayload.hint && (
              <div className="bg-[#1e1640] rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Hint</p>
                <p className="text-yellow-300">{rolePayload.hint}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-[#1e1640] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Your question</p>
              <p className={`font-medium leading-snug ${isImpostor ? 'text-red-200' : 'text-green-200'}`}>
                {rolePayload.question}
              </p>
            </div>
            {isImpostor && (
              <p className="text-gray-400 text-sm text-center">
                Others got a different question — blend in!
              </p>
            )}
          </>
        )}

        {rolePayload.impostorPartners?.length > 0 && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-xs text-red-400 mb-1">
              Your partner{rolePayload.impostorPartners.length > 1 ? 's' : ''}
            </p>
            <p className="text-red-200 font-semibold">{rolePayload.impostorPartners.join(', ')}</p>
          </div>
        )}

        <p className="text-center text-gray-500 text-xs">Card hides automatically in a few seconds</p>
      </div>

      <button
        onClick={onDone}
        className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
      >
        {doneLabel}
      </button>
    </div>
  );
}
