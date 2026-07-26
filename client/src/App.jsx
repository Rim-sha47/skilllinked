import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './redux/store';
import { AppRoutes } from './routes';
import { setTheme } from './redux/slices/themeSlice';
import { Toaster } from 'react-hot-toast';

import { socket, connectSocket, disconnectSocket } from './services/socket';
import { addRealtimeNotification } from './redux/slices/notificationSlice';
import { receiveMessage, removeMessage } from './redux/slices/messagingSlice';

// A wrapper component to handle initial theme logic and sockets
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Sync initial theme state with document class
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  useEffect(() => {
    if (user && token) {
      connectSocket(user);

      socket.on('notification', (newNotification) => {
        dispatch(addRealtimeNotification(newNotification));
      });

      socket.on('message received', (newMessage) => {
        dispatch(receiveMessage(newMessage));
      });

      socket.on('message deleted', (data) => {
        dispatch(removeMessage(data));
      });
    }

    return () => {
      socket.off('notification');
      socket.off('message received');
      socket.off('message deleted');
      disconnectSocket();
    };
  }, [user, token, dispatch]);

  return children;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#ffe6e6', minHeight: '100vh' }}>
          <h2>Something went wrong in the UI.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => { localStorage.clear(); window.location.href='/'; }} style={{ padding: '10px', marginTop: '20px', background: 'red', color: 'white', border: 'none', borderRadius: '5px' }}>
            Clear Data & Restart
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppInitializer>
          <BrowserRouter>
            <Toaster position="top-right" />
            <AppRoutes />
          </BrowserRouter>
        </AppInitializer>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
