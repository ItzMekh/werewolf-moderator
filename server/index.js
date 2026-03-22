const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const gameManager = require('./gameManager');
const gameLogic = require('./gameLogic');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Werewolf server running' });
});

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  // ===== ROOM MANAGEMENT =====

  socket.on('create-room', (callback) => {
    const room = gameManager.createRoom(socket.id);
    socket.join(room.code);
    console.log(`Room created: ${room.code} by ${socket.id}`);
    callback({ success: true, roomCode: room.code });
  });

  socket.on('join-room', ({ roomCode, playerName }, callback) => {
    const result = gameManager.joinRoom(roomCode, playerName, socket.id);
    if (result.error) {
      callback({ success: false, error: result.error });
      return;
    }

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerName = playerName;

    // Notify moderator and other players
    io.to(roomCode).emit('player-joined', {
      players: result.room.players.map(p => ({
        name: p.name,
        connected: p.connected
      }))
    });

    callback({ success: true, player: { name: result.player.name } });
  });

  // ===== GAME START =====

  socket.on('start-game', ({ roomCode, roleConfig }, callback) => {
    const room = gameManager.getRoom(roomCode);
    if (!room) return callback({ success: false, error: 'Room not found' });
    if (room.moderatorId !== socket.id) return callback({ success: false, error: 'Not the moderator' });
    if (room.players.length < 4) return callback({ success: false, error: 'Need at least 4 players' });

    // Assign roles
    const assignResult = gameLogic.assignRoles(room.players, roleConfig);
    if (assignResult.error) return callback({ success: false, error: assignResult.error });

    // Create game state
    room.gameState = gameLogic.createGameState(roleConfig);

    // Send each player their role privately
    room.players.forEach(player => {
      const roleInfo = gameLogic.getRoleInfo(player.role);
      io.to(player.id).emit('role-assigned', {
        role: player.role,
        team: roleInfo.team,
        emoji: roleInfo.emoji
      });
    });

    // Notify everyone that game started
    io.to(roomCode).emit('game-started', {
      phase: 'night',
      round: 1,
      players: room.players.map(p => ({
        name: p.name,
        alive: p.alive
      }))
    });

    // Tell werewolves who the other werewolves are
    const werewolves = room.players.filter(p => p.role === 'werewolf');
    const werewolfNames = werewolves.map(w => w.name);
    werewolves.forEach(wolf => {
      io.to(wolf.id).emit('werewolf-teammates', {
        teammates: werewolfNames.filter(n => n !== wolf.name)
      });
    });

    // Send moderator all player roles
    io.to(room.moderatorId).emit('all-roles', {
      players: room.players.map(p => ({
        name: p.name,
        role: p.role,
        team: gameLogic.getRoleInfo(p.role).team,
        emoji: gameLogic.getRoleInfo(p.role).emoji
      }))
    });

    callback({ success: true });
  });

  // ===== NIGHT ACTIONS =====

  socket.on('night-action', ({ roomCode, action, target }, callback) => {
    const room = gameManager.getRoom(roomCode);
    if (!room || !room.gameState) return callback({ success: false, error: 'No active game' });
    if (room.gameState.phase !== 'night') return callback({ success: false, error: 'Not night phase' });

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.alive) return callback({ success: false, error: 'Invalid player' });

    const { nightActions, lastBodyguardTarget } = room.gameState;

    switch (action) {
      case 'werewolf-kill':
        if (player.role !== 'werewolf') return callback({ success: false, error: 'Not a werewolf' });
        nightActions.werewolfVotes[player.name] = target;

        // Notify other werewolves of this vote
        const otherWolves = room.players.filter(p => p.role === 'werewolf' && p.id !== socket.id && p.alive);
        otherWolves.forEach(wolf => {
          io.to(wolf.id).emit('werewolf-vote-update', {
            voter: player.name,
            target
          });
        });

        // Notify moderator
        io.to(room.moderatorId).emit('night-action-received', {
          role: 'werewolf',
          player: player.name,
          target
        });
        break;

      case 'seer-check':
        if (player.role !== 'seer') return callback({ success: false, error: 'Not a seer' });
        nightActions.seerCheck = target;

        // Immediately tell seer the result
        const checkedPlayer = room.players.find(p => p.name === target);
        if (checkedPlayer) {
          const info = gameLogic.getRoleInfo(checkedPlayer.role);
          io.to(socket.id).emit('seer-result', {
            target: checkedPlayer.name,
            team: info.team,
            role: checkedPlayer.role,
            emoji: info.emoji
          });
        }

        io.to(room.moderatorId).emit('night-action-received', {
          role: 'seer',
          player: player.name,
          target
        });
        break;

      case 'doctor-save':
        if (player.role !== 'doctor') return callback({ success: false, error: 'Not a doctor' });
        nightActions.doctorSave = target;
        io.to(room.moderatorId).emit('night-action-received', {
          role: 'doctor',
          player: player.name,
          target
        });
        break;

      case 'bodyguard-protect':
        if (player.role !== 'bodyguard') return callback({ success: false, error: 'Not a bodyguard' });
        // Can't protect same person two nights in a row
        if (target === lastBodyguardTarget) {
          return callback({ success: false, error: 'Cannot protect the same person two nights in a row' });
        }
        nightActions.bodyguardProtect = target;
        io.to(room.moderatorId).emit('night-action-received', {
          role: 'bodyguard',
          player: player.name,
          target
        });
        break;

      default:
        return callback({ success: false, error: 'Unknown action' });
    }

    // Check if all night actions are in
    const allDone = gameLogic.allNightActionsSubmitted(room.gameState, room.players);
    if (allDone) {
      io.to(room.moderatorId).emit('all-night-actions-received');
    }

    callback({ success: true });
  });

  // ===== RESOLVE NIGHT (Moderator only) =====

  socket.on('resolve-night', ({ roomCode }, callback) => {
    const room = gameManager.getRoom(roomCode);
    if (!room || !room.gameState) return callback({ success: false, error: 'No active game' });
    if (room.moderatorId !== socket.id) return callback({ success: false, error: 'Not the moderator' });

    const result = gameLogic.resolveNight(room.gameState, room.players);

    // Check win condition
    const winCheck = gameLogic.checkWinCondition(room.players);

    if (winCheck.gameOver) {
      room.gameState.phase = 'finished';
      io.to(roomCode).emit('game-over', {
        winner: winCheck.winner,
        reason: winCheck.reason,
        players: room.players.map(p => ({
          name: p.name,
          role: p.role,
          alive: p.alive,
          emoji: gameLogic.getRoleInfo(p.role).emoji
        }))
      });
      callback({ success: true, result, gameOver: true, winner: winCheck.winner });
      return;
    }

    // Move to day phase
    room.gameState.phase = 'day';

    io.to(roomCode).emit('night-result', {
      killed: result.killed,
      savedBy: result.savedBy,
      protectedBy: result.protectedBy,
      phase: 'day',
      round: room.gameState.round,
      players: room.players.map(p => ({
        name: p.name,
        alive: p.alive
      }))
    });

    // Send seer result only to moderator (seer already got it instantly)
    if (result.seerResult) {
      io.to(room.moderatorId).emit('seer-check-result', result.seerResult);
    }

    callback({ success: true, result });
  });

  // ===== DAY VOTE =====

  socket.on('day-vote', ({ roomCode, target }, callback) => {
    const room = gameManager.getRoom(roomCode);
    if (!room || !room.gameState) return callback({ success: false, error: 'No active game' });
    if (room.gameState.phase !== 'day') return callback({ success: false, error: 'Not day phase' });

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.alive) return callback({ success: false, error: 'Invalid player' });

    room.gameState.dayVotes[player.name] = target;

    // Notify moderator of vote
    io.to(room.moderatorId).emit('day-vote-received', {
      voter: player.name,
      target
    });

    // Broadcast vote count update
    const alivePlayers = room.players.filter(p => p.alive);
    const votedCount = Object.keys(room.gameState.dayVotes).length;
    io.to(roomCode).emit('vote-count-update', {
      voted: votedCount,
      total: alivePlayers.length
    });

    // Check if all alive players have voted
    if (votedCount >= alivePlayers.length) {
      io.to(room.moderatorId).emit('all-day-votes-received');
    }

    callback({ success: true });
  });

  // ===== RESOLVE DAY (Moderator only) =====

  socket.on('resolve-day', ({ roomCode }, callback) => {
    const room = gameManager.getRoom(roomCode);
    if (!room || !room.gameState) return callback({ success: false, error: 'No active game' });
    if (room.moderatorId !== socket.id) return callback({ success: false, error: 'Not the moderator' });

    const result = gameLogic.resolveDayVote(room.gameState, room.players);

    // Check win condition
    const winCheck = gameLogic.checkWinCondition(room.players);

    if (winCheck.gameOver) {
      room.gameState.phase = 'finished';
      io.to(roomCode).emit('game-over', {
        winner: winCheck.winner,
        reason: winCheck.reason,
        players: room.players.map(p => ({
          name: p.name,
          role: p.role,
          alive: p.alive,
          emoji: gameLogic.getRoleInfo(p.role).emoji
        }))
      });
      callback({ success: true, result, gameOver: true, winner: winCheck.winner });
      return;
    }

    // Move to next night
    room.gameState.phase = 'night';
    room.gameState.round += 1;

    io.to(roomCode).emit('day-result', {
      eliminated: result.eliminated,
      tally: result.tally,
      tied: result.tied,
      skipped: result.skipped,
      phase: 'night',
      round: room.gameState.round,
      players: room.players.map(p => ({
        name: p.name,
        alive: p.alive
      }))
    });

    callback({ success: true, result });
  });

  // ===== END GAME (Moderator only) =====

  socket.on('end-game', ({ roomCode }, callback) => {
    const room = gameManager.getRoom(roomCode);
    if (!room) return callback({ success: false, error: 'Room not found' });
    if (room.moderatorId !== socket.id) return callback({ success: false, error: 'Not the moderator' });

    io.to(roomCode).emit('game-ended', {
      players: room.players.map(p => ({
        name: p.name,
        role: p.role,
        alive: p.alive,
        emoji: gameLogic.getRoleInfo(p.role).emoji
      }))
    });

    // Reset game state but keep room
    room.gameState = null;
    room.players.forEach(p => {
      p.role = null;
      p.alive = true;
    });

    callback({ success: true });
  });

  // ===== DISCONNECT =====

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    const result = gameManager.removePlayer(socket.id);
    if (!result) return;

    if (result.type === 'moderator') {
      io.to(result.roomCode).emit('room-closed', { reason: 'Moderator disconnected' });
    } else if (result.type === 'player-leave') {
      io.to(result.roomCode).emit('player-left', {
        playerName: result.player.name,
        players: result.room.players.map(p => ({
          name: p.name,
          connected: p.connected
        }))
      });
    } else if (result.type === 'player-disconnect') {
      io.to(result.roomCode).emit('player-disconnected', {
        playerName: result.player.name,
        players: result.room.players.map(p => ({
          name: p.name,
          connected: p.connected,
          alive: p.alive
        }))
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Werewolf server running on port ${PORT}`);
});
