const { isConnected } = require('./db/mongodb');

// In-memory cache (primary store for speed)
const rooms = new Map();

// Lazy-load Room model to avoid errors if mongoose isn't connected
let RoomModel = null;
function getModel() {
  if (!RoomModel) {
    try {
      RoomModel = require('./models/Room');
    } catch (e) { /* mongoose not available */ }
  }
  return RoomModel;
}

// ===== MongoDB sync helpers =====

// Save room to MongoDB (fire-and-forget, non-blocking)
function syncRoom(code) {
  if (!isConnected()) return;
  const Room = getModel();
  if (!Room) return;

  const room = rooms.get(code);
  if (!room) {
    Room.deleteOne({ code }).catch(() => {});
    return;
  }

  Room.findOneAndUpdate(
    { code },
    {
      code: room.code,
      moderatorId: room.moderatorId,
      players: room.players,
      gameState: room.gameState,
      settings: room.settings,
      lastActivity: new Date()
    },
    { upsert: true, new: true }
  ).catch(err => {
    console.error('MongoDB sync error:', err.message);
  });
}

// Restore all rooms from MongoDB into memory on server startup
async function restoreRooms() {
  if (!isConnected()) return 0;
  const Room = getModel();
  if (!Room) return 0;

  try {
    const savedRooms = await Room.find({});
    for (const doc of savedRooms) {
      const room = {
        code: doc.code,
        moderatorId: doc.moderatorId,
        players: (doc.players || []).map(p => ({
          id: p.id,
          name: p.name,
          alive: p.alive,
          role: p.role,
          connected: false,  // everyone is disconnected after restart
          dbPlayerId: p.dbPlayerId || null
        })),
        gameState: doc.gameState || null,
        settings: doc.settings || { roles: {} }
      };
      rooms.set(doc.code, room);
    }
    console.log(`Restored ${savedRooms.length} room(s) from MongoDB`);
    return savedRooms.length;
  } catch (err) {
    console.error('Failed to restore rooms from MongoDB:', err.message);
    return 0;
  }
}

// ===== Room management (same API as before, now with sync) =====

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

function createRoom(moderatorSocketId) {
  const code = generateRoomCode();
  const room = {
    code,
    moderatorId: moderatorSocketId,
    players: [],
    gameState: null,
    settings: {
      roles: {}
    }
  };
  rooms.set(code, room);
  syncRoom(code);
  return room;
}

function getRoom(code) {
  return rooms.get(code);
}

function joinRoom(code, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.gameState && room.gameState.phase !== 'lobby') {
    return { error: 'Game already started' };
  }
  const existing = room.players.find(p => p.name === playerName);
  if (existing) return { error: 'Name already taken' };

  const player = {
    id: socketId,
    name: playerName,
    alive: true,
    role: null,
    connected: true
  };
  room.players.push(player);
  syncRoom(code);
  return { player, room };
}

function removePlayer(socketId) {
  for (const [code, room] of rooms) {
    // Check if moderator disconnected
    if (room.moderatorId === socketId) {
      // Don't delete room immediately — mark moderator as disconnected
      // Room persists in MongoDB for potential reconnection
      room.moderatorId = null;
      syncRoom(code);
      return { type: 'moderator', roomCode: code, room };
    }
    // Check if player disconnected
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      if (room.gameState && room.gameState.phase !== 'lobby') {
        // During game, mark as disconnected but keep in game
        player.connected = false;
        syncRoom(code);
        return { type: 'player-disconnect', roomCode: code, player, room };
      } else {
        // In lobby, remove completely
        room.players.splice(playerIndex, 1);
        syncRoom(code);
        return { type: 'player-leave', roomCode: code, player, room };
      }
    }
  }
  return null;
}

function reconnectPlayer(code, playerName, newSocketId) {
  const room = rooms.get(code);
  if (!room) return null;
  const player = room.players.find(p => p.name === playerName && !p.connected);
  if (player) {
    player.id = newSocketId;
    player.connected = true;
    syncRoom(code);
    return { player, room };
  }
  return null;
}

function reconnectModerator(code, newSocketId) {
  const room = rooms.get(code);
  if (!room) return null;
  // Allow reconnect if moderator slot is empty (disconnected)
  if (room.moderatorId && room.moderatorId !== newSocketId) return null;
  room.moderatorId = newSocketId;
  syncRoom(code);
  return room;
}

function deleteRoom(code) {
  rooms.delete(code);
  // Also remove from MongoDB
  if (isConnected()) {
    const Room = getModel();
    if (Room) {
      Room.deleteOne({ code }).catch(() => {});
    }
  }
}

function getAllRooms() {
  return rooms;
}

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  removePlayer,
  reconnectPlayer,
  reconnectModerator,
  deleteRoom,
  getAllRooms,
  syncRoom,
  restoreRooms
};
