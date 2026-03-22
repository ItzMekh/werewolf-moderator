import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function createSocket() {
  const token = localStorage.getItem('werewolf-token');
  return io(SERVER_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    auth: token ? { token } : {}
  });
}

let socket = createSocket();

// Recreate socket when auth changes
export function reconnectSocket() {
  socket.disconnect();
  socket = createSocket();
  socket.connect();
  return socket;
}

export function getSocket() {
  return socket;
}

export default socket;
