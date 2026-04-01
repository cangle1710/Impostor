import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LobbyPage from './pages/LobbyPage.jsx';
import RoleRevealPage from './pages/RoleRevealPage.jsx';
import DiscussionPage from './pages/DiscussionPage.jsx';
import VotingPage from './pages/VotingPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';

function GameRouter() {
  const { phase } = useSocket();

  switch (phase) {
    case 'LOBBY':       return <LobbyPage />;
    case 'ROLE_REVEAL': return <RoleRevealPage />;
    case 'DISCUSSION':  return <DiscussionPage />;
    case 'VOTING':      return <VotingPage />;
    case 'RESULTS':     return <ResultsPage />;
    default:            return <HomePage />;
  }
}

export default function App() {
  return (
    <SocketProvider>
      <GameRouter />
    </SocketProvider>
  );
}
