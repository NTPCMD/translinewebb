import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLocalAuthed } from '../utils/localAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLocalAuthed()) navigate('/login');
    setLoading(false);
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!isLocalAuthed()) return null;

  return <>{children}</>;
}
