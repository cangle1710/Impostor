import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createRoom,
  getRoom,
  getRoomBySocketId,
  deleteRoom,
  addPlayer,
  promoteNextHost,
  publicPlayers,
} from './roomManager.js';
import {
  assignRoles,
  getRolePayload,
  advanceReveal,
  allRevealed,
  castVote,
  allVoted,
  resolveVotes,
} from './gameEngine.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  // ─── Create Room ───────────────────────────────────────────────────────────
  socket.on('room:create', ({ playerName }) => {
    const name = String(playerName || '').trim().slice(0, 20);
    if (!name) return socket.emit('room:error', { message: 'Name is required.' });

    const room = createRoom(socket.id, name);
    socket.join(room.code);
    socket.emit('room:created', {
      roomCode: room.code,
      playerId: socket.id,
      players: publicPlayers(room.players),
      settings: room.settings,
    });
  });

  // ─── Join Room ─────────────────────────────────────────────────────────────
  socket.on('room:join', ({ playerName, roomCode }) => {
    const name = String(playerName || '').trim().slice(0, 20);
    const code = String(roomCode || '').trim().toUpperCase();
    if (!name) return socket.emit('room:error', { message: 'Name is required.' });

    const room = getRoom(code);
    if (!room) return socket.emit('room:error', { message: 'Room not found.' });
    if (room.state !== 'LOBBY') return socket.emit('room:error', { message: 'Game already in progress.' });
    if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return socket.emit('room:error', { message: 'That name is already taken.' });
    }
    if (room.players.length >= 20) {
      return socket.emit('room:error', { message: 'Room is full.' });
    }

    addPlayer(room, socket.id, name);
    socket.join(code);

    socket.emit('room:joined', {
      roomCode: code,
      playerId: socket.id,
      players: publicPlayers(room.players),
      settings: room.settings,
    });
    socket.to(code).emit('room:updated', { players: publicPlayers(room.players) });
  });

  // ─── Rejoin Room ───────────────────────────────────────────────────────────
  socket.on('room:rejoin', ({ playerName, roomCode }) => {
    const name = String(playerName || '').trim();
    const code = String(roomCode || '').trim().toUpperCase();
    const room = getRoom(code);
    if (!room) return socket.emit('room:error', { message: 'Room no longer exists.' });

    const existing = room.players.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (!existing) {
      // Room exists but player is no longer in it; let them join fresh if lobby
      if (room.state === 'LOBBY') {
        addPlayer(room, socket.id, name);
        socket.join(code);
        socket.emit('room:joined', {
          roomCode: code,
          playerId: socket.id,
          players: publicPlayers(room.players),
          settings: room.settings,
        });
        socket.to(code).emit('room:updated', { players: publicPlayers(room.players) });
      } else {
        socket.emit('room:error', { message: 'Could not rejoin game.' });
      }
      return;
    }

    // Cancel pending cleanup if any
    if (room.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
      room.cleanupTimer = null;
    }

    existing.id = socket.id;
    existing.isConnected = true;
    socket.join(code);

    // Restore host if needed
    if (!room.players.some((p) => p.isHost && p.isConnected)) {
      existing.isHost = true;
      room.hostId = socket.id;
    }

    socket.emit('room:rejoined', {
      roomCode: code,
      playerId: socket.id,
      players: publicPlayers(room.players),
      settings: room.settings,
      state: room.state,
    });
    socket.to(code).emit('room:updated', { players: publicPlayers(room.players) });

    // If mid-game, resend role
    if (room.state === 'ROLE_REVEAL') {
      const nextId = room.round.revealOrder[room.round.revealIndex];
      socket.emit('reveal:next', {
        nextPlayerId: nextId,
        revealedCount: room.round.revealIndex,
        totalCount: room.round.revealOrder.length,
      });
    }
    if (room.state === 'DISCUSSION') {
      socket.emit('phase:discussion', {
        durationSeconds: room.settings.discussionSeconds,
        discussionEndsAt: room.round.discussionEndsAt,
      });
    }
    if (room.state === 'VOTING') {
      socket.emit('phase:voting', { players: publicPlayers(room.players) });
    }
  });

  // ─── Update Settings ───────────────────────────────────────────────────────
  socket.on('settings:update', (newSettings) => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.hostId !== socket.id || room.state !== 'LOBBY') return;

    // Validate imposters count
    const maxImposters = Math.max(1, room.players.length - 1);
    const numImposters = Math.min(
      Math.max(1, parseInt(newSettings.numImposters) || 1),
      maxImposters
    );

    room.settings = {
      ...room.settings,
      ...newSettings,
      numImposters,
    };

    io.to(room.code).emit('settings:updated', { settings: room.settings });
  });

  // ─── Start Game ────────────────────────────────────────────────────────────
  socket.on('game:start', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.hostId !== socket.id || room.state !== 'LOBBY') return;

    const connected = room.players.filter((p) => p.isConnected);
    if (connected.length < 2) {
      return socket.emit('room:error', { message: 'Need at least 2 players.' });
    }
    if (room.settings.numImposters >= connected.length) {
      return socket.emit('room:error', { message: 'Too many impostors for this player count.' });
    }

    assignRoles(room);

    io.to(room.code).emit('game:starting', {
      revealOrder: room.round.revealOrder,
    });

    // Send first reveal prompt
    const firstId = room.round.revealOrder[0];
    io.to(room.code).emit('reveal:next', {
      nextPlayerId: firstId,
      revealedCount: 0,
      totalCount: room.round.revealOrder.length,
    });
  });

  // ─── Role Reveal Ready ─────────────────────────────────────────────────────
  socket.on('reveal:view', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.state !== 'ROLE_REVEAL') return;

    const currentId = room.round.revealOrder[room.round.revealIndex];
    if (currentId !== socket.id) return; // not your turn

    // Send private role to this player
    const rolePayload = getRolePayload(room, socket.id);
    socket.emit('role:assigned', rolePayload);
  });

  socket.on('reveal:ready', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.state !== 'ROLE_REVEAL') return;

    const currentId = room.round.revealOrder[room.round.revealIndex];
    if (currentId !== socket.id) return;

    advanceReveal(room);

    if (allRevealed(room)) {
      startDiscussion(room);
    } else {
      const nextId = room.round.revealOrder[room.round.revealIndex];
      io.to(room.code).emit('reveal:next', {
        nextPlayerId: nextId,
        revealedCount: room.round.revealIndex,
        totalCount: room.round.revealOrder.length,
      });
    }
  });

  // ─── Skip Discussion (host) ────────────────────────────────────────────────
  socket.on('discussion:skip', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.hostId !== socket.id || room.state !== 'DISCUSSION') return;
    if (room.round.discussionTimer) clearTimeout(room.round.discussionTimer);
    startVoting(room);
  });

  // ─── Cast Vote ─────────────────────────────────────────────────────────────
  socket.on('vote:cast', ({ targetId }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.state !== 'VOTING') return;

    const voted = castVote(room, socket.id, targetId);
    if (!voted) return;

    // Broadcast vote counts (not who voted for whom)
    const voteCounts = {};
    for (const [tid, voters] of Object.entries(room.round.votes)) {
      voteCounts[tid] = voters.length;
    }
    io.to(room.code).emit('vote:updated', { votes: voteCounts });

    if (allVoted(room)) {
      endVoting(room);
    }
  });

  // ─── Force End Voting (host) ───────────────────────────────────────────────
  socket.on('vote:forceEnd', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.hostId !== socket.id || room.state !== 'VOTING') return;
    endVoting(room);
  });

  // ─── Impostor Word Guess ───────────────────────────────────────────────────
  socket.on('impostor:guess', ({ guess }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.state !== 'DISCUSSION') return;
    if (!room.settings.allowImpostorGuess) return;
    if (!room.round.impostorIds.includes(socket.id)) return;
    if (room.settings.gameMode !== 'WORD') return;

    const correct = guess.trim().toLowerCase() === room.round.word.toLowerCase();
    if (correct) {
      if (room.round.discussionTimer) clearTimeout(room.round.discussionTimer);
      room.state = 'RESULTS';
      io.to(room.code).emit('phase:results', {
        caught: false,
        eliminated: null,
        impostors: room.round.impostorIds.map((id) => ({
          id,
          name: room.players.find((p) => p.id === id)?.name || 'Unknown',
        })),
        secret: room.round.word,
        votes: {},
        impostorGuessedCorrectly: true,
        guesserName: room.players.find((p) => p.id === socket.id)?.name,
      });
    } else {
      socket.emit('impostor:guessResult', { correct: false });
    }
  });

  // ─── Play Again ────────────────────────────────────────────────────────────
  socket.on('game:restart', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room || room.hostId !== socket.id) return;

    if (room.round?.discussionTimer) clearTimeout(room.round.discussionTimer);
    room.state = 'LOBBY';
    room.round = null;
    room.players.forEach((p) => {
      p.hasRevealed = false;
      p.hasVoted = false;
      p.vote = null;
    });

    io.to(room.code).emit('game:restarted', {
      players: publicPlayers(room.players),
      settings: room.settings,
    });
  });

  // ─── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.isConnected = false;

    const stillConnected = room.players.some((p) => p.isConnected);
    if (!stillConnected) {
      room.cleanupTimer = setTimeout(() => deleteRoom(room.code), 30_000);
      return;
    }

    if (player.isHost) {
      player.isHost = false;
      promoteNextHost(room);
    }

    io.to(room.code).emit('room:updated', { players: publicPlayers(room.players) });

    // If voting and this was the last needed vote
    if (room.state === 'VOTING' && allVoted(room)) {
      endVoting(room);
    }
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function startDiscussion(room) {
    room.state = 'DISCUSSION';
    const endsAt = Date.now() + room.settings.discussionSeconds * 1000;
    room.round.discussionEndsAt = endsAt;
    room.round.discussionTimer = setTimeout(() => startVoting(room), room.settings.discussionSeconds * 1000);
    io.to(room.code).emit('phase:discussion', {
      durationSeconds: room.settings.discussionSeconds,
      discussionEndsAt: endsAt,
    });
  }

  function startVoting(room) {
    room.state = 'VOTING';
    io.to(room.code).emit('phase:voting', { players: publicPlayers(room.players) });
  }

  function endVoting(room) {
    room.state = 'RESULTS';
    const result = resolveVotes(room);
    io.to(room.code).emit('phase:results', result);
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Impostor server running on port ${PORT}`));
