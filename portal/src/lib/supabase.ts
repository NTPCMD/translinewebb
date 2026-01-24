// Local Supabase auth stub to keep the portal functional without external SDKs.

export type User = {
  id: string;
  email?: string;
};

export type Session = {
  user: User;
};

type AuthChangeCallback = (event: string, session: Session | null) => void;

type AuthStateSubscription = {
  unsubscribe: () => void;
};

let currentSession: Session | null = null;
const listeners = new Set<AuthChangeCallback>();

const notifyAuthChange = (event: string, session: Session | null) => {
  listeners.forEach((callback) => callback(event, session));
};

const mockAuth = {
  getSession: async () => ({ data: { session: currentSession } }),
  onAuthStateChange: (callback: AuthChangeCallback) => {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => listeners.delete(callback),
        } as AuthStateSubscription,
      },
    };
  },
  signInWithPassword: async ({ email }: { email: string; password: string }) => {
    currentSession = {
      user: {
        id: "local-user",
        email,
      },
    };
    notifyAuthChange("SIGNED_IN", currentSession);
    return { error: null };
  },
  signOut: async () => {
    currentSession = null;
    notifyAuthChange("SIGNED_OUT", null);
  },
};

export const supabase = {
  auth: mockAuth,
};
