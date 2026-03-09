import { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
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
  updateProfile: (updates: { display_name?: string }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Admin UIDs — only these users see the Dashboard button and can access /admin
const ADMIN_UIDS = new Set([
  'a63e2d07-a368-4c46-adc7-08276dd24a33', // admin4optiplan@gmail.com
]);

function buildProfile(user: User, avatarUrl?: string | null): Profile {
  const meta = user.user_metadata ?? {};
  const firstName = meta.first_name ?? '';
  const lastName = meta.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;
  return {
    id: user.id,
    email: user.email ?? meta.email ?? '',
    display_name: fullName ?? meta.display_name ?? meta.full_name ?? null,
    avatar_url: avatarUrl ?? null,
    role: ADMIN_UIDS.has(user.id) ? 'admin' : 'user',
    created_at: user.created_at,
  };
}

async function fetchAvatarUrl(userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();
    return data?.avatar_url ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // Set profile synchronously, then fetch avatar in background
  const setProfileAndFetchAvatar = useCallback((u: User) => {
    setProfile(buildProfile(u));
    // Fire-and-forget: fetch avatar URL and update profile when ready
    fetchAvatarUrl(u.id).then(avatarUrl => {
      if (avatarUrl) {
        setProfile(prev => prev && prev.id === u.id ? { ...prev, avatar_url: avatarUrl } : prev);
      }
    });
  }, []);

  // Upsert user presence
  const upsertPresence = useCallback(async (userId: string, isOnline: boolean) => {
    try {
      await supabase.from('user_presence').upsert({
        user_id: userId,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setProfileAndFetchAvatar(s.user);
        upsertPresence(s.user.id, true);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setProfileAndFetchAvatar(s.user);
        upsertPresence(s.user.id, true);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Set offline on window unload — read from ref to avoid adding `user` as a dep
    const handleUnload = () => {
      const u = userRef.current;
      if (u) {
        // Use sendBeacon for reliability on unload
        const body = JSON.stringify({
          user_id: u.id,
          is_online: false,
          last_seen: new Date().toISOString(),
        });
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL ?? 'https://zgxmzpzuedqclfvphuqy.supabase.co'}/rest/v1/user_presence?on_conflict=user_id`,
          new Blob([body], { type: 'application/json' }),
        );
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setProfileAndFetchAvatar, upsertPresence]);

  async function signOut() {
    if (user) {
      await upsertPresence(user.id, false);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  async function updateProfile(updates: { display_name?: string }) {
    if (!user) throw new Error('Not authenticated');

    if (updates.display_name !== undefined) {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: updates.display_name },
      });
      if (error) throw error;
    }

    // Refresh profile
    const { data: { user: refreshed } } = await supabase.auth.getUser();
    if (refreshed) {
      setUser(refreshed);
      setProfileAndFetchAvatar(refreshed);
    }
  }

  async function updatePassword(_currentPassword: string, newPassword: string) {
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function uploadAvatar(file: File) {
    if (!user) throw new Error('Not authenticated');

    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    if (updateError) throw updateError;

    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, updateProfile, updatePassword, uploadAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

const defaultValue: AuthContextValue = {
  user: null,
  session: null,
  profile: null,
  loading: false,
  signOut: async () => { },
  updateProfile: async () => { },
  updatePassword: async () => { },
  uploadAvatar: async () => { },
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext) ?? defaultValue;
}
