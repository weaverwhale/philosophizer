import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading: authLoading, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  // Show loading state if not authenticated (loading or redirecting)
  if (!isAuthenticated) {
    return (
      <div className="py-23">
        <Logo />
      </div>
    );
  }

  return <>{children}</>;
}
