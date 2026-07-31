import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5001';

export const socket = io(URL, {
  autoConnect: false,
});

export const connectSocket = (user) => {
  if (user && user._id && !socket.connected) {
    socket.connect();
    socket.emit('setup', user);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
