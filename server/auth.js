const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { isConnected } = require('./db/mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'werewolf-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Lazy-load models to avoid errors if mongoose isn't connected
let Player = null;
let Game = null;

function getPlayer() {
  if (!Player) {
    try { Player = require('./models/Player'); } catch { return null; }
  }
  return Player;
}

function getGame() {
  if (!Game) {
    try { Game = require('./models/Game'); } catch { return null; }
  }
  return Game;
}

function dbAvailable() {
  return isConnected() && getPlayer() !== null;
}

// ===== Auth =====

async function register(username, password) {
  if (!dbAvailable()) return { error: 'Database unavailable' };

  const PlayerModel = getPlayer();
  const existing = await PlayerModel.findOne({ username });
  if (existing) return { error: 'Username already taken' };

  const passwordHash = await bcrypt.hash(password, 10);
  const player = await PlayerModel.create({ username, passwordHash });

  const token = jwt.sign({ id: player._id.toString(), username: player.username }, JWT_SECRET, { expiresIn: '30d' });
  return { token, player: { id: player._id.toString(), username: player.username } };
}

async function login(username, password) {
  if (!dbAvailable()) return { error: 'Database unavailable' };

  const PlayerModel = getPlayer();
  const player = await PlayerModel.findOne({ username });
  if (!player) return { error: 'Invalid username or password' };

  const valid = await bcrypt.compare(password, player.passwordHash);
  if (!valid) return { error: 'Invalid username or password' };

  const token = jwt.sign({ id: player._id.toString(), username: player.username }, JWT_SECRET, { expiresIn: '30d' });
  return { token, player: { id: player._id.toString(), username: player.username } };
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
  if (!dbAvailable()) {
    return { totalGames: 0, totalWins: 0, totalLosses: 0, winRate: 0, roles: {}, achievements: [] };
  }

  const PlayerModel = getPlayer();
  const player = await PlayerModel.findById(playerId);
  if (!player) return { totalGames: 0, totalWins: 0, totalLosses: 0, winRate: 0, roles: {}, achievements: [] };

  const roles = {};
  if (player.roleStats) {
    for (const [roleName, stat] of player.roleStats) {
      roles[roleName] = {
        played: stat.played || 0,
        wins: stat.wins || 0,
        losses: (stat.played || 0) - (stat.wins || 0)
      };
    }
  }

  return {
    totalGames: player.matchesPlayed,
    totalWins: player.matchesWon,
    totalLosses: player.matchesPlayed - player.matchesWon,
    winRate: player.matchesPlayed > 0 ? Math.round((player.matchesWon / player.matchesPlayed) * 100) : 0,
    roles,
    achievements: player.achievements.map(a => ({
      title: a.title,
      description: a.description,
      unlockedAt: a.unlockedAt
    }))
  };
}

// ===== Save game results =====

async function saveGameStats(room, winnerTeam) {
  if (!dbAvailable()) return null;

  const PlayerModel = getPlayer();
  const GameModel = getGame();
  const gameLogic = require('./gameLogic');

  const gamePlayers = room.players.map(p => {
    const roleInfo = gameLogic.getRoleInfo(p.role);
    return {
      playerId: p.dbPlayerId || null,
      username: p.name,
      role: p.role,
      isWinner: winnerTeam === roleInfo.team,
      isAlive: p.alive
    };
  });

  const game = await GameModel.create({
    roomCode: room.code,
    winnerTeam,
    playerCount: room.players.length,
    rounds: room.gameState ? room.gameState.round : 0,
    players: gamePlayers,
    startedAt: new Date(),
    endedAt: new Date()
  });

  // Update per-player stats
  for (const p of room.players) {
    if (!p.dbPlayerId) continue;
    const roleInfo = gameLogic.getRoleInfo(p.role);
    const isWinner = winnerTeam === roleInfo.team;

    const update = {
      $inc: {
        matchesPlayed: 1,
        ...(isWinner ? { matchesWon: 1 } : {}),
        [`roleStats.${p.role}.played`]: 1,
        ...(isWinner ? { [`roleStats.${p.role}.wins`]: 1 } : {})
      }
    };

    await PlayerModel.findByIdAndUpdate(p.dbPlayerId, update, { upsert: false });
    await checkAchievements(p.dbPlayerId);
  }

  return game;
}

// ===== Achievements =====

const ACHIEVEMENT_DEFS = [
  { title: 'First Blood', description: 'Play your first game', check: (p) => p.matchesPlayed >= 1 },
  { title: 'Veteran', description: 'Play 10 games', check: (p) => p.matchesPlayed >= 10 },
  { title: 'Champion', description: 'Win 10 games', check: (p) => p.matchesWon >= 10 },
  { title: 'Master Wolf', description: 'Win 5 games as werewolf', roleCheck: { role: 'werewolf', wins: 5 } },
  { title: 'Golden Shield', description: 'Win 5 games as bodyguard', roleCheck: { role: 'bodyguard', wins: 5 } },
  { title: 'All-Seeing Eye', description: 'Win 5 games as seer', roleCheck: { role: 'seer', wins: 5 } },
];

async function checkAchievements(playerId) {
  const PlayerModel = getPlayer();
  const player = await PlayerModel.findById(playerId);
  if (!player) return;

  const existingTitles = new Set(player.achievements.map(a => a.title));
  const newAchievements = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (existingTitles.has(def.title)) continue;

    let earned = false;
    if (def.check) {
      earned = def.check(player);
    } else if (def.roleCheck) {
      const stat = player.roleStats.get(def.roleCheck.role);
      earned = stat && (stat.wins || 0) >= def.roleCheck.wins;
    }

    if (earned) {
      newAchievements.push({ title: def.title, description: def.description });
    }
  }

  if (newAchievements.length > 0) {
    await PlayerModel.findByIdAndUpdate(playerId, {
      $push: { achievements: { $each: newAchievements } }
    });
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

  if (!dbAvailable()) return { error: 'Database unavailable' };

  const PlayerModel = getPlayer();
  let player = await PlayerModel.findOne({ googleId: payload.sub });

  if (!player) {
    const username = await PlayerModel.findOne({ username: googleUsername })
      ? `${googleUsername}_${payload.sub.slice(-4)}`
      : googleUsername;

    player = await PlayerModel.create({
      username,
      passwordHash: `google:${payload.sub}`,
      googleId: payload.sub
    });
  }

  const token = jwt.sign({ id: player._id.toString(), username: player.username }, JWT_SECRET, { expiresIn: '30d' });
  return {
    token,
    player: { id: player._id.toString(), username: player.username },
    googleName: payload.name,
    googlePicture: payload.picture
  };
}

// ===== Helpers =====

async function getPlayerByUsername(username) {
  if (!dbAvailable()) return null;
  return getPlayer().findOne({ username });
}

module.exports = { register, login, googleLogin, verifyToken, getPlayerStats, saveGameStats, getPlayerByUsername };
