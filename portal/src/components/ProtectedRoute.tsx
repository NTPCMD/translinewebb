import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isLocalAuthed } from '../utils/localAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isLocalAuthed()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
