const mongoose = require('mongoose');

const gamePlayerSchema = new mongoose.Schema({
  playerId: String,
  username: String,
  role: String,
  isWinner: Boolean,
  isAlive: Boolean
}, { _id: false });

const gameSchema = new mongoose.Schema({
  roomCode: String,
  winnerTeam: String,
  playerCount: Number,
  rounds: Number,
  players: [gamePlayerSchema],
  startedAt: Date,
  endedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
