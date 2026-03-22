const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'werewolf-secret-key-change-in-production';

async function register(username, password) {
  const existing = await prisma.player.findUnique({ where: { username } });
  if (existing) return { error: 'Username already taken' };

  const passwordHash = await bcrypt.hash(password, 10);
  const player = await prisma.player.create({
    data: { username, passwordHash }
  });

  const token = jwt.sign({ id: player.id, username: player.username }, JWT_SECRET, { expiresIn: '30d' });
  return { token, player: { id: player.id, username: player.username } };
}

async function login(username, password) {
  const player = await prisma.player.findUnique({ where: { username } });
  if (!player) return { error: 'Invalid username or password' };

  const valid = await bcrypt.compare(password, player.passwordHash);
  if (!valid) return { error: 'Invalid username or password' };

  const token = jwt.sign({ id: player.id, username: player.username }, JWT_SECRET, { expiresIn: '30d' });
  return { token, player: { id: player.id, username: player.username } };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function getPlayerStats(playerId) {
  const gamePlayers = await prisma.gamePlayer.findMany({
    where: { playerId },
    include: { role: true, game: true }
  });

  const stats = {};
  let totalGames = 0;
  let totalWins = 0;

  for (const gp of gamePlayers) {
    const roleName = gp.role.name;
    if (!stats[roleName]) {
      stats[roleName] = { played: 0, wins: 0, losses: 0 };
    }
    stats[roleName].played++;
    totalGames++;
    if (gp.isWinner) {
      stats[roleName].wins++;
      totalWins++;
    } else {
      stats[roleName].losses++;
    }
  }

  return {
    totalGames,
    totalWins,
    totalLosses: totalGames - totalWins,
    winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
    roles: stats
  };
}

async function saveGameStats(room, winnerTeam) {
  const gameLogic = require('./gameLogic');

  // Create game record
  const game = await prisma.game.create({
    data: {
      roomCode: room.code,
      status: 'finished',
      winnerTeam,
      playerCount: room.players.length,
      rounds: room.gameState ? room.gameState.round : 0,
      startedAt: new Date(),
      endedAt: new Date()
    }
  });

  // Save each player's game data
  for (const player of room.players) {
    // Only save for logged-in players
    if (!player.dbPlayerId) continue;

    const roleInfo = gameLogic.getRoleInfo(player.role);
    const isWinner = (winnerTeam === roleInfo.team);

    // Find or create role
    let role = await prisma.role.findUnique({ where: { name: player.role } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: player.role,
          team: roleInfo.team,
          hasNightAction: roleInfo.hasNightAction
        }
      });
    }

    await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        playerId: player.dbPlayerId,
        roleId: role.id,
        isAlive: player.alive,
        deathRound: null,
        deathCause: null,
        isWinner
      }
    });
  }

  return game;
}

module.exports = { register, login, verifyToken, getPlayerStats, saveGameStats, prisma };
