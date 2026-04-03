import { useState } from 'react';
import { useLobby } from '../context/LobbyContext.jsx';
import RoleCard from '../components/RoleCard.jsx';

export default function OnlineRoleRevealPage() {
  const { myRole, settings, isHost, startDiscussion, leaveLobby } = useLobby();
  const [roleViewed, setRoleViewed] = useState(false);

  if (!myRole) return null;

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-4 py-8 safe-pt safe-pb">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={leaveLobby} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Leave
          </button>
          <h2 className="text-xl font-bold text-white">Your Role</h2>
          <div className="w-12" />
        </div>
        <p className="text-gray-400 text-sm text-center -mt-2">
          View your role privately — don't show others!
        </p>

        {/* Role card */}
        <div className="flex-1">
          <RoleCard
            rolePayload={myRole}
            gameMode={settings?.gameMode ?? 'WORD'}
            onDone={() => setRoleViewed(true)}
            doneLabel="Got it — I'm ready"
          />
        </div>

        {/* Host: start discussion once ready */}
        {isHost && roleViewed && (
          <button
            onClick={startDiscussion}
            className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-lg transition-colors active:scale-95"
          >
            Everyone's ready — Start Discussion
          </button>
        )}

        {/* Non-host: wait for host */}
        {!isHost && roleViewed && (
          <div className="bg-[#1e1640] border border-[#352a5e] rounded-2xl px-4 py-4 text-center">
            <p className="text-gray-300 text-sm">Waiting for the host to start the discussion...</p>
          </div>
        )}

      </div>
    </div>
  );
}
