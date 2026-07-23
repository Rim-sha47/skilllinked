import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './redux/store';
import { AppRoutes } from './routes';
import { setTheme } from './redux/slices/themeSlice';

// A wrapper component to handle initial theme logic that requires the Redux store
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);

  useEffect(() => {
    // Sync initial theme state with document class
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

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
            <AppRoutes />
          </BrowserRouter>
        </AppInitializer>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
