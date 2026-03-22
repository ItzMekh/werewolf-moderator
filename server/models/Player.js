const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: String,
  description: String,
  unlockedAt: { type: Date, default: Date.now }
}, { _id: false });

const roleStatSchema = new mongoose.Schema({
  played: { type: Number, default: 0 },
  wins: { type: Number, default: 0 }
}, { _id: false });

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  googleId: { type: String, default: null },
  matchesPlayed: { type: Number, default: 0 },
  matchesWon: { type: Number, default: 0 },
  roleStats: { type: Map, of: roleStatSchema, default: {} },
  achievements: [achievementSchema]
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
