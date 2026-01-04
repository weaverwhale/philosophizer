import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

export function ProtectedRoute() {
  const { loading: authLoading, isAuthenticated } = useAuth();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="py-23.25">
        <Logo />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render child routes
  return <Outlet />;
}
