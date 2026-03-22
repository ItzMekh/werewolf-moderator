const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  id: String,           // socket ID (changes on reconnect)
  name: String,
  alive: Boolean,
  role: String,
  connected: Boolean,
  dbPlayerId: String    // MongoDB Player _id for stats
}, { _id: false });

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  moderatorId: String,
  players: [playerSchema],
  gameState: mongoose.Schema.Types.Mixed,
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: { roles: {} }
  },
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true,
  minimize: false  // preserve empty objects like {}
});

// Auto-delete rooms inactive for 24 hours
roomSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Room', roomSchema);
