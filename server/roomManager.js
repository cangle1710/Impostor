// In-memory room store
const rooms = new Map();

function generateCode() {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  return rooms.has(code) ? generateCode() : code;
}

export function createRoom(hostId, hostName) {
  const code = generateCode();
  const room = {
    code,
    state: 'LOBBY',
    hostId,
    cleanupTimer: null,
    players: [
      {
        id: hostId,
        name: hostName,
        isHost: true,
        isConnected: true,
        hasRevealed: false,
        hasVoted: false,
        vote: null,
      },
    ],
    settings: {
      numImposters: 1,
      gameMode: 'WORD',
      category: 'all',
      showCategoryToImpostor: false,
      showHintToImpostor: false,
      impostersKnowEachOther: true,
      discussionSeconds: 180,
      allowImpostorGuess: true,
    },
    round: null,
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function getRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === socketId)) return room;
  }
  return null;
}

export function deleteRoom(code) {
  rooms.delete(code);
}

export function addPlayer(room, socketId, name) {
  room.players.push({
    id: socketId,
    name,
    isHost: false,
    isConnected: true,
    hasRevealed: false,
    hasVoted: false,
    vote: null,
  });
}

export function removePlayer(room, socketId) {
  room.players = room.players.filter((p) => p.id !== socketId);
}

export function promoteNextHost(room) {
  const next = room.players.find((p) => p.isConnected);
  if (next) {
    next.isHost = true;
    room.hostId = next.id;
  }
}

export function publicPlayers(players) {
  return players.map(({ id, name, isHost, isConnected }) => ({
    id,
    name,
    isHost,
    isConnected,
  }));
}
