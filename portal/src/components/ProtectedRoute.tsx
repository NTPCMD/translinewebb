// Protected route wrapper for authenticated pages
import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center" role="status">
          <div className="w-16 h-16 border-4 border-[#BE1C2D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Opening your admin workspace…</p>
        </div>
      </div>
    );
  }

  // The portal is admin-only. Authentication alone is not enough: a driver account
  // holding a valid session (restored from storage, so never routed through signIn)
  // would otherwise reach the admin UI.
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
