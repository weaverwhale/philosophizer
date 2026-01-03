import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatPage } from './pages/ChatPage';
import { AboutPage } from './pages/AboutPage';
import { SearchPage } from './pages/SearchPage';
import { AdminPage } from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './styles.css';

// Add manifest link dynamically to avoid Bun trying to resolve it as a module
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = '/manifest.json';
  document.head.appendChild(link);
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route based on path
  if (currentPath === '/login') {
    return <LoginPage />;
  }

  if (currentPath === '/signup') {
    return <SignupPage />;
  }

  // All other routes require authentication
  return (
    <ProtectedRoute>
      {currentPath === '/about' && <AboutPage />}
      {currentPath === '/search' && <SearchPage />}
      {currentPath === '/admin' && <AdminPage />}
      {/* Default to chat interface (handles / and /c/:id) */}
      {currentPath !== '/about' &&
        currentPath !== '/search' &&
        currentPath !== '/admin' && <ChatPage />}
    </ProtectedRoute>
  );
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
