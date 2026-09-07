// Authentication context for TransLine Admin Portal
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; user?: User }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

/**
 * The portal is admin-only. signIn() checks this, but a session restored from storage
 * never passes through signIn(), so the role has to be re-verified for every session
 * the provider adopts -- otherwise a driver account with a valid session lands straight
 * in the admin portal on reload.
 */
async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to verify portal access role:', error);
    return false;
  }
  return data?.role === 'admin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// gotrue serializes auth work behind a navigator.locks lock that is shared across
// every tab of the origin. A lock held by another (stuck) tab makes getSession()
// wait forever, which leaves `loading` true and strands the portal on its startup
// spinner with no way out. Bound the wait so a stalled lock acquisition falls
// through to the unauthenticated state (which routes to /login) instead of hanging.
const AUTH_INIT_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} did not settle within ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function logLogoutSource(reason: string) {
  console.error('[AUTH LOGOUT SOURCE]', reason);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for active session on mount
    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_INIT_TIMEOUT_MS,
          'supabase.auth.getSession()',
        );

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          setIsAdmin(await fetchIsAdmin(currentSession.user.id));
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        console.error('[AUTH LOGOUT SOURCE]', 'supabase-auth-state-signed-out');
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAdmin(currentSession?.user ? await fetchIsAdmin(currentSession.user.id) : false);
      setLoading(false);

      // Persist session to localStorage if needed
      if (currentSession) {
        localStorage.setItem('supabase.session', JSON.stringify(currentSession));
      } else {
        localStorage.removeItem('supabase.session');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: any; user?: User }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Portal is admin-only: require profiles.role === 'admin'.
      if (data.user?.id) {
        if (!(await fetchIsAdmin(data.user.id))) {
          console.error('Non-admin account detected during portal sign-in.');
          await supabase.auth.signOut({ scope: 'local' });
          setIsAdmin(false);
          return {
            error: new Error('This account does not have admin access.'),
          };
        }
        setIsAdmin(true);
      }

      // Session is automatically set by onAuthStateChange listener
      return { error: null, user: data.user || undefined };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      logLogoutSource('explicit-user-logout');
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      // Always clear local auth state so the UI reliably returns to login.
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      localStorage.removeItem('supabase.session');
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user && !!session,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth called outside AuthProvider; falling back to unauthenticated state.');
    return {
      user: null,
      session: null,
      loading: false,
      signIn: async () => ({ error: new Error('Auth is not initialized.') }),
      signOut: async () => {},
      isAuthenticated: false,
      isAdmin: false,
    };
  }
  return context;
}
