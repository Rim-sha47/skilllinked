import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    let newSocket;
    
    // Only connect if the user is authenticated
    if (isAuthenticated) {
      // Connect to the Socket.io server
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      
      newSocket = io(SOCKET_URL, {
        autoConnect: true,
        // You can pass authentication tokens here
        auth: {
          token: localStorage.getItem('token') || 'mock-token',
        },
        // Helpful for debugging
        transports: ['websocket', 'polling'], 
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected:', newSocket.id);
        
        // Emitting an event to let the server know this user is online
        if (user) {
          newSocket.emit('user_online', { userId: user.id });
        }
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      setSocket(newSocket);
    }

    // Cleanup on unmount or when auth state changes
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  return { socket, isConnected };
};
