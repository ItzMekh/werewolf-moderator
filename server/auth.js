const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'werewolf-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Lazy Prisma init — server works without DB (game doesn't need it)
let prisma = null;
function getPrisma() {
  if (!prisma) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      console.log('Prisma client initialized (MongoDB)');
    } catch (err) {
      console.error('Prisma init failed (auth/stats disabled):', err.message);
      return null;
    }
  }
  return prisma;
}

// ===== Auth =====

async function register(username, password) {
  const db = getPrisma();
  if (!db) return { error: 'Database unavailable' };

  const existing = await db.player.findUnique({ where: { username } });
  if (existing) return { error: 'Username already taken' };

  const passwordHash = await bcrypt.hash(password, 10);
  const player = await db.player.create({
    data: { username, passwordHash }
  });

  const token = jwt.sign({ id: player.id, username: player.username }, JWT_SECRET, { expiresIn: '30d' });
  return { token, player: { id: player.id, username: player.username } };
}

async function login(username, password) {
  const db = getPrisma();
  if (!db) return { error: 'Database unavailable' };

  const player = await db.player.findUnique({ where: { username } });
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

// ===== Stats =====

async function getPlayerStats(playerId) {
  const db = getPrisma();
  if (!db) return { totalGames: 0, totalWins: 0, totalLosses: 0, winRate: 0, roles: {}, achievements: [] };

  const gamePlayers = await db.gamePlayer.findMany({
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

  // Fetch achievements
  const achievements = await db.playerAchievement.findMany({ where: { playerId } });

  return {
    totalGames,
    totalWins,
    totalLosses: totalGames - totalWins,
    winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
    roles: stats,
    achievements: achievements.map(a => ({ title: a.title, description: a.description, unlockedAt: a.unlockedAt }))
  };
}

// ===== Save game results =====

async function saveGameStats(room, winnerTeam) {
  const db = getPrisma();
  if (!db) return null;

  const gameLogic = require('./gameLogic');

  // Create game record
  const game = await db.game.create({
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
    if (!player.dbPlayerId) continue; // only logged-in players

    const roleInfo = gameLogic.getRoleInfo(player.role);
    const isWinner = (winnerTeam === roleInfo.team);

    // Find or create role
    let role = await db.role.findUnique({ where: { name: player.role } });
    if (!role) {
      role = await db.role.create({
        data: {
          name: player.role,
          team: roleInfo.team,
          hasNightAction: roleInfo.hasNightAction
        }
      });
    }

    await db.gamePlayer.create({
      data: {
        gameId: game.id,
        playerId: player.dbPlayerId,
        roleId: role.id,
        isAlive: player.alive,
        isWinner
      }
    });

    // Update counters on Player
    await db.player.update({
      where: { id: player.dbPlayerId },
      data: {
        matchesPlayed: { increment: 1 },
        ...(isWinner ? { matchesWon: { increment: 1 } } : {})
      }
    });

    // Check achievements
    await checkAchievements(player.dbPlayerId, db);
  }

  return game;
}

// ===== Achievements =====

const ACHIEVEMENT_DEFS = [
  { title: 'First Blood', description: 'Play your first game', check: (p) => p.matchesPlayed >= 1 },
  { title: 'Veteran', description: 'Play 10 games', check: (p) => p.matchesPlayed >= 10 },
  { title: 'Champion', description: 'Win 10 games', check: (p) => p.matchesWon >= 10 },
  { title: 'Master Wolf', description: 'Win 5 games as werewolf', check: null, roleCheck: { role: 'werewolf', wins: 5 } },
  { title: 'Golden Shield', description: 'Win 5 games as bodyguard', check: null, roleCheck: { role: 'bodyguard', wins: 5 } },
  { title: 'All-Seeing Eye', description: 'Win 5 games as seer', check: null, roleCheck: { role: 'seer', wins: 5 } },
];

async function checkAchievements(playerId, db) {
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player) return;

  const existing = await db.playerAchievement.findMany({ where: { playerId } });
  const existingTitles = new Set(existing.map(a => a.title));

  // Get role-specific win counts
  const roleWins = {};
  const gamePlayers = await db.gamePlayer.findMany({
    where: { playerId, isWinner: true },
    include: { role: true }
  });
  for (const gp of gamePlayers) {
    roleWins[gp.role.name] = (roleWins[gp.role.name] || 0) + 1;
  }

  for (const def of ACHIEVEMENT_DEFS) {
    if (existingTitles.has(def.title)) continue;

    let earned = false;
    if (def.check) {
      earned = def.check(player);
    } else if (def.roleCheck) {
      earned = (roleWins[def.roleCheck.role] || 0) >= def.roleCheck.wins;
    }

    if (earned) {
      try {
        await db.playerAchievement.create({
          data: { playerId, title: def.title, description: def.description }
        });
      } catch { /* ignore duplicate */ }
    }
  }
}

// ===== Google OAuth =====

async function googleLogin(credential) {
  if (!GOOGLE_CLIENT_ID) return { error: 'Google login not configured' };

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const googleUsername = payload.name || payload.email.split('@')[0];

  const db = getPrisma();
  if (!db) return { error: 'Database unavailable' };

  // Find by googleId or create
  let player = await db.player.findUnique({ where: { googleId: payload.sub } });

  if (!player) {
    try {
      player = await db.player.create({
        data: {
          username: googleUsername,
          passwordHash: `google:${payload.sub}`,
          googleId: payload.sub
        }
      });
    } catch {
      // Username conflict — add suffix
      player = await db.player.create({
        data: {
          username: `${googleUsername}_${payload.sub.slice(-4)}`,
          passwordHash: `google:${payload.sub}`,
          googleId: payload.sub
        }
      });
    }
  }

  const token = jwt.sign({ id: player.id, username: player.username }, JWT_SECRET, { expiresIn: '30d' });
  return {
    token,
    player: { id: player.id, username: player.username },
    googleName: payload.name,
    googlePicture: payload.picture
  };
}

// ===== Helpers =====

async function getPlayerByUsername(username) {
  const db = getPrisma();
  if (!db) return null;
  return db.player.findUnique({ where: { username } });
}

module.exports = { register, login, googleLogin, verifyToken, getPlayerStats, saveGameStats, getPlayerByUsername, getPrisma };
