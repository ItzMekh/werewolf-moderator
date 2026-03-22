const mongoose = require('mongoose');

// If MONGODB_PASSWORD is set separately, inject it into the URI
// This avoids URL-encoding issues with special characters in passwords
function buildURI() {
  const raw = process.env.MONGODB_URI || 'mongodb://localhost:27017/werewolf';
  const password = process.env.MONGODB_PASSWORD;
  if (password) {
    // Replace the password portion in the URI with the raw password (properly encoded)
    return raw.replace(/\/\/([^:]+):([^@]+)@/, (_, user) => {
      return `//${user}:${encodeURIComponent(password)}@`;
    });
  }
  return raw;
}

let lastError = null;

async function connectDB() {
  const uri = buildURI();
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    lastError = null;
    console.log('MongoDB connected:', uri.replace(/\/\/.*@/, '//<credentials>@'));
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
