const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/werewolf';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    return true;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.log('Game will run without persistence (in-memory only)');
    return false;
  }
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected };
