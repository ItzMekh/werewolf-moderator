const { z } = require('zod');

// ===== Socket Event Schemas =====

const roomCodeSchema = z.string().regex(/^\d{4}$/, 'Room code must be 4 digits');
const playerNameSchema = z.string().min(1).max(20).trim();

const joinRoom = z.object({
  roomCode: roomCodeSchema,
  playerName: playerNameSchema
});

const rejoinRoom = z.object({
  roomCode: roomCodeSchema,
  playerName: playerNameSchema
});

const rejoinModerator = z.object({
  roomCode: roomCodeSchema
});

const updateRoleConfig = z.object({
  roomCode: roomCodeSchema,
  roleConfig: z.record(z.string(), z.number().int().min(0).max(20))
});

const requestLobbyInfo = z.object({
  roomCode: roomCodeSchema
});

const startGame = z.object({
  roomCode: roomCodeSchema,
  roleConfig: z.record(z.string(), z.number().int().min(0).max(20))
});

const startNight = z.object({
  roomCode: roomCodeSchema
});

const nightAction = z.object({
  roomCode: roomCodeSchema,
  action: z.enum(['werewolf-kill', 'seer-check', 'bodyguard-protect']),
  target: playerNameSchema
});

const resolveNight = z.object({
  roomCode: roomCodeSchema
});

const dayVote = z.object({
  roomCode: roomCodeSchema,
  target: z.string().min(1).max(20) // can be player name or 'skip'
});

const resolveDay = z.object({
  roomCode: roomCodeSchema
});

const playAgain = z.object({
  roomCode: roomCodeSchema
});

const endGame = z.object({
  roomCode: roomCodeSchema
});

// ===== HTTP API Schemas =====

const registerBody = z.object({
  username: z.string().min(2).max(20).trim(),
  password: z.string().min(4)
});

const loginBody = z.object({
  username: z.string().min(1).max(20).trim(),
  password: z.string().min(1)
});

const googleLoginBody = z.object({
  credential: z.string().min(1)
});

// ===== Helper =====

/**
 * Validate socket event payload.
 * Returns { success: true, data } or { success: false, error }.
 */
function validate(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  return { success: false, error: `Invalid payload: ${firstError.path.join('.')} — ${firstError.message}` };
}

module.exports = {
  schemas: {
    joinRoom,
    rejoinRoom,
    rejoinModerator,
    updateRoleConfig,
    requestLobbyInfo,
    startGame,
    startNight,
    nightAction,
    resolveNight,
    dayVote,
    resolveDay,
    playAgain,
    endGame,
    registerBody,
    loginBody,
    googleLoginBody
  },
  validate
};
