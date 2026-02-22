import { useState, useEffect, useContext, createContext } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Admin UIDs — only these users see the Dashboard button and can access /admin
const ADMIN_UIDS = new Set([
  'a63e2d07-a368-4c46-adc7-08276dd24a33', // admin4optiplan@gmail.com
]);

function buildProfile(user: User): Profile {
  const meta = user.user_metadata ?? {};
  const firstName = meta.first_name ?? '';
  const lastName = meta.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;
  return {
    id: user.id,
    email: user.email ?? meta.email ?? '',
    display_name: fullName ?? meta.display_name ?? meta.full_name ?? null,
    role: ADMIN_UIDS.has(user.id) ? 'admin' : 'user',
    created_at: user.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setProfile(s?.user ? buildProfile(s.user) : null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setProfile(s?.user ? buildProfile(s.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

const defaultValue: AuthContextValue = {
  user: null,
  session: null,
  profile: null,
  loading: false,
  signOut: async () => {},
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext) ?? defaultValue;
}
