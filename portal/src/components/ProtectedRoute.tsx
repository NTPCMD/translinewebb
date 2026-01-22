import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLocalAuthed } from '../utils/localAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLocalAuthed()) {
      navigate('/login');
    }
  }, [navigate]);

  if (!isLocalAuthed()) return null;

  return <>{children}</>;
}
