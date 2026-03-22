const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/werewolf';

let lastError = null;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    lastError = null;
    console.log('MongoDB connected:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    return true;
  } catch (err) {
    lastError = err.message;
    console.error('MongoDB connection failed:', err.message);
    console.log('Game will run without persistence (in-memory only)');
    return false;
  }
}

function getLastError() {
  return lastError;
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected, getLastError };
