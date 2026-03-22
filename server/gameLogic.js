// Shuffle array using Fisher-Yates algorithm
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Assign roles to players based on room settings
function assignRoles(players, roleConfig) {
  // roleConfig = { werewolf: 2, seer: 1, doctor: 1, bodyguard: 1, villager: 3 }
  const roles = [];
  for (const [role, count] of Object.entries(roleConfig)) {
    for (let i = 0; i < count; i++) {
      roles.push(role);
    }
  }

  if (roles.length !== players.length) {
    return { error: `Role count (${roles.length}) doesn't match player count (${players.length})` };
  }

  const shuffledRoles = shuffle(roles);
  players.forEach((player, i) => {
    player.role = shuffledRoles[i];
    player.alive = true;
  });

  return { success: true };
}

// Create initial game state
function createGameState(roleConfig) {
  return {
    phase: 'night', // "night" | "day" | "lobby" | "finished"
    round: 1,
    roleConfig,
    nightActions: {
      werewolfVotes: {},    // { voterId: targetName }
      seerCheck: null,       // targetName
      doctorSave: null,      // targetName
      bodyguardProtect: null  // targetName
    },
    dayVotes: {},            // { voterId: targetName }
    lastBodyguardTarget: null, // Track for "can't protect same person twice"
    deaths: [],              // Deaths to announce
    log: []                  // Event log
  };
}

// Get role info for a specific role
function getRoleInfo(role) {
  const roles = {
    werewolf: { team: 'werewolf', hasNightAction: true, emoji: '🐺' },
    seer: { team: 'village', hasNightAction: true, emoji: '👁️' },
    doctor: { team: 'village', hasNightAction: true, emoji: '💊' },
    bodyguard: { team: 'village', hasNightAction: true, emoji: '🛡️' },
    villager: { team: 'village', hasNightAction: false, emoji: '👤' }
  };
  return roles[role] || { team: 'village', hasNightAction: false, emoji: '👤' };
}

// Process werewolf votes — return the target with most votes
function getWerewolfTarget(nightActions, players) {
  const votes = Object.values(nightActions.werewolfVotes);
  if (votes.length === 0) return null;

  const tally = {};
  votes.forEach(target => {
    tally[target] = (tally[target] || 0) + 1;
  });

  // Find the target with the most votes
  let maxVotes = 0;
  let target = null;
  for (const [name, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count;
      target = name;
    }
  }
  return target;
}

// Resolve night phase — determine who dies
function resolveNight(gameState, players) {
  const { nightActions } = gameState;
  const result = {
    killed: null,
    savedBy: null,
    protectedBy: null,
    seerResult: null,
    deaths: []
  };

  // 1. Get werewolf target
  const werewolfTarget = getWerewolfTarget(nightActions, players);

  // 2. Check seer result
  if (nightActions.seerCheck) {
    const checkedPlayer = players.find(p => p.name === nightActions.seerCheck);
    if (checkedPlayer) {
      const info = getRoleInfo(checkedPlayer.role);
      result.seerResult = {
        target: checkedPlayer.name,
        team: info.team,
        role: checkedPlayer.role
      };
    }
  }

  // 3. Check if target was saved by doctor
  const doctorSaved = nightActions.doctorSave === werewolfTarget;

  // 4. Check if target was protected by bodyguard
  const bodyguardProtected = nightActions.bodyguardProtect === werewolfTarget;

  // 5. Determine if someone dies
  if (werewolfTarget) {
    if (doctorSaved) {
      result.savedBy = 'doctor';
    } else if (bodyguardProtected) {
      result.protectedBy = 'bodyguard';
    } else {
      // Target dies
      const targetPlayer = players.find(p => p.name === werewolfTarget);
      if (targetPlayer && targetPlayer.alive) {
        targetPlayer.alive = false;
        result.killed = werewolfTarget;
        result.deaths.push({
          name: werewolfTarget,
          cause: 'werewolf',
          round: gameState.round
        });
      }
    }
  }

  // Update last bodyguard target
  gameState.lastBodyguardTarget = nightActions.bodyguardProtect;

  // Log the night
  gameState.log.push({
    round: gameState.round,
    phase: 'night',
    werewolfTarget,
    doctorSave: nightActions.doctorSave,
    bodyguardProtect: nightActions.bodyguardProtect,
    seerCheck: nightActions.seerCheck,
    result: result.killed ? `${result.killed} killed` : 'No one died'
  });

  // Reset night actions for next night
  gameState.nightActions = {
    werewolfVotes: {},
    seerCheck: null,
    doctorSave: null,
    bodyguardProtect: null
  };

  return result;
}

// Process day votes — return the target with most votes
function resolveDayVote(gameState, players) {
  const votes = gameState.dayVotes;
  const voteEntries = Object.values(votes);

  if (voteEntries.length === 0) {
    return { eliminated: null, tally: {}, skipped: true };
  }

  const tally = {};
  voteEntries.forEach(target => {
    if (target === 'skip') return;
    tally[target] = (tally[target] || 0) + 1;
  });

  // Count skips
  const skipCount = voteEntries.filter(v => v === 'skip').length;

  // Find max voted
  let maxVotes = 0;
  let eliminated = null;
  for (const [name, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = name;
    }
  }

  // If skip has more or equal votes, no elimination
  if (skipCount >= maxVotes) {
    return { eliminated: null, tally, skipCount, skipped: true };
  }

  // Check for tie
  const tiedPlayers = Object.entries(tally).filter(([, count]) => count === maxVotes);
  if (tiedPlayers.length > 1) {
    return { eliminated: null, tally, skipCount, tied: true, tiedPlayers: tiedPlayers.map(([name]) => name) };
  }

  // Eliminate the player
  if (eliminated) {
    const targetPlayer = players.find(p => p.name === eliminated);
    if (targetPlayer) {
      targetPlayer.alive = false;
    }
  }

  // Log
  gameState.log.push({
    round: gameState.round,
    phase: 'day',
    votes: { ...votes },
    result: eliminated ? `${eliminated} eliminated` : 'No elimination'
  });

  // Reset day votes
  gameState.dayVotes = {};

  return { eliminated, tally, skipCount };
}

// Check win conditions
function checkWinCondition(players) {
  const alive = players.filter(p => p.alive);
  const werewolves = alive.filter(p => p.role === 'werewolf');
  const villagers = alive.filter(p => p.role !== 'werewolf');

  if (werewolves.length === 0) {
    return { gameOver: true, winner: 'village', reason: 'All werewolves eliminated' };
  }

  if (werewolves.length >= villagers.length) {
    return { gameOver: true, winner: 'werewolf', reason: 'Werewolves outnumber villagers' };
  }

  return { gameOver: false };
}

// Get default role config based on player count
function getDefaultRoleConfig(playerCount) {
  // Flexible config based on player count
  if (playerCount <= 5) {
    return { werewolf: 1, seer: 1, doctor: 1, villager: playerCount - 3 };
  } else if (playerCount <= 8) {
    return { werewolf: 2, seer: 1, doctor: 1, bodyguard: 1, villager: playerCount - 5 };
  } else if (playerCount <= 12) {
    return { werewolf: 3, seer: 1, doctor: 1, bodyguard: 1, villager: playerCount - 6 };
  } else {
    return { werewolf: 4, seer: 1, doctor: 1, bodyguard: 1, villager: playerCount - 7 };
  }
}

// Check if all expected night actions have been submitted
function allNightActionsSubmitted(gameState, players) {
  const alivePlayers = players.filter(p => p.alive);

  // Check werewolves
  const aliveWerewolves = alivePlayers.filter(p => p.role === 'werewolf');
  const werewolfVoteCount = Object.keys(gameState.nightActions.werewolfVotes).length;
  if (werewolfVoteCount < aliveWerewolves.length) return false;

  // Check seer
  const aliveSeer = alivePlayers.find(p => p.role === 'seer');
  if (aliveSeer && !gameState.nightActions.seerCheck) return false;

  // Check doctor
  const aliveDoctor = alivePlayers.find(p => p.role === 'doctor');
  if (aliveDoctor && !gameState.nightActions.doctorSave) return false;

  // Check bodyguard
  const aliveBodyguard = alivePlayers.find(p => p.role === 'bodyguard');
  if (aliveBodyguard && !gameState.nightActions.bodyguardProtect) return false;

  return true;
}

module.exports = {
  assignRoles,
  createGameState,
  getRoleInfo,
  resolveNight,
  resolveDayVote,
  checkWinCondition,
  getDefaultRoleConfig,
  allNightActionsSubmitted
};
