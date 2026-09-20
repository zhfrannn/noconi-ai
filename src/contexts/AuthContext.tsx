import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: any | null;
  user: any | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Without Supabase credentials the app runs fully offline as a guest.
    if (!supabase) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    // Restore a previously chosen guest mode.
    if (localStorage.getItem('isGuest') === 'true') setIsGuest(true);

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      // A real session always wins over a stale guest flag.
      if (data.session) setIsGuest(false);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession) setIsGuest(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('isGuest');
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isGuest, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
