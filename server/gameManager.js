const rooms = new Map();

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
  return room;
}

function getRoom(code) {
  return rooms.get(code);
}

function joinRoom(code, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.gameState && room.gameState.phase !== 'lobby') {
    return { error: 'Game already in progress' };
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
  return { player, room };
}

function removePlayer(socketId) {
  for (const [code, room] of rooms) {
    // Check if moderator disconnected
    if (room.moderatorId === socketId) {
      rooms.delete(code);
      return { type: 'moderator', roomCode: code, room };
    }
    // Check if player disconnected
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      if (room.gameState && room.gameState.phase !== 'lobby') {
        // During game, mark as disconnected but keep in game
        player.connected = false;
        return { type: 'player-disconnect', roomCode: code, player, room };
      } else {
        // In lobby, remove completely
        room.players.splice(playerIndex, 1);
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
    return { player, room };
  }
  return null;
}

function deleteRoom(code) {
  rooms.delete(code);
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
  deleteRoom,
  getAllRooms
};
