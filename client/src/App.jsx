import { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext.jsx';
import { LobbyProvider, useLobby } from './context/LobbyContext.jsx';

import LandingPage from './pages/LandingPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import RoleRevealPage from './pages/RoleRevealPage.jsx';
import DiscussionPage from './pages/DiscussionPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';

import OnlineLobbyPage from './pages/OnlineLobbyPage.jsx';
import WaitingRoomPage from './pages/WaitingRoomPage.jsx';
import OnlineRoleRevealPage from './pages/OnlineRoleRevealPage.jsx';
import OnlineDiscussionPage from './pages/OnlineDiscussionPage.jsx';
import OnlineResultsPage from './pages/OnlineResultsPage.jsx';

function LocalRouter({ onExit }) {
  const { phase } = useGame();
  switch (phase) {
    case 'ROLE_REVEAL': return <RoleRevealPage />;
    case 'DISCUSSION':  return <DiscussionPage />;
    case 'RESULTS':     return <ResultsPage />;
    default:            return <SetupPage onExit={onExit} />;
  }
}

function OnlineRouter({ onBack }) {
  const { phase, lobbyCode } = useLobby();
  if (!lobbyCode) return <OnlineLobbyPage onBack={onBack} />;
  switch (phase) {
    case 'ROLE_REVEAL': return <OnlineRoleRevealPage />;
    case 'DISCUSSION':  return <OnlineDiscussionPage />;
    case 'RESULTS':     return <OnlineResultsPage />;
    default:            return <WaitingRoomPage />;
  }
}

export default function App() {
  const [mode, setMode] = useState(null);

  if (!mode) return <LandingPage onSelect={setMode} />;

  if (mode === 'local') {
    return (
      <GameProvider>
        <LocalRouter onExit={() => setMode(null)} />
      </GameProvider>
    );
  }

  return (
    <LobbyProvider>
      <OnlineRouter onBack={() => setMode(null)} />
    </LobbyProvider>
  );
}
