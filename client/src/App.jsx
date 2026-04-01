import React from 'react';
import { GameProvider, useGame } from './context/GameContext.jsx';
import SetupPage from './pages/SetupPage.jsx';
import RoleRevealPage from './pages/RoleRevealPage.jsx';
import DiscussionPage from './pages/DiscussionPage.jsx';
import VotingPage from './pages/VotingPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';

function GameRouter() {
  const { phase } = useGame();
  switch (phase) {
    case 'ROLE_REVEAL': return <RoleRevealPage />;
    case 'DISCUSSION':  return <DiscussionPage />;
    case 'VOTING':      return <VotingPage />;
    case 'RESULTS':     return <ResultsPage />;
    default:            return <SetupPage />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
