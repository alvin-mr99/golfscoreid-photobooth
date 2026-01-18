import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context';
import { ErrorBoundary, FullscreenButton } from './components';
import { WelcomePage, ScorePage } from './pages';
import { setupKioskMode, setupGlobalErrorHandler } from './utils';
import './App.css';

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/score-photo/:flightId" element={<ScorePage />} />
      </Routes>
      <FullscreenButton />
    </>
  );
}

function App() {
  useEffect(() => {
    // Setup kiosk mode (prevent keyboard shortcuts, right-click, etc.)
    const cleanupKiosk = setupKioskMode();
    
    // Setup global error handler
    const cleanupErrorHandler = setupGlobalErrorHandler();

    // Cleanup on unmount
    return () => {
      cleanupKiosk();
      cleanupErrorHandler();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
