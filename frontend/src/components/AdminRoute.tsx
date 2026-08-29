import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';

// Like ProtectedRoute, but also checks the Admin role.
// Non-admins get sent to the dashboard instead of the admin page.
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}