import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthSession, UserType, InternalRole, PartnerRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authSession: AuthSession;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const defaultAuthSession: AuthSession = {
  user_type: null,
  user_id: null,
  auth_id: null,
  role: null,
  partner_id: null,
  name: null,
  email: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession>(defaultAuthSession);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (authId: string) => {
    try {
      // Check internal users first
      const { data: internalUser } = await supabase
        .from('users_internal')
        .select('*')
        .eq('auth_id', authId)
        .eq('is_active', true)
        .maybeSingle();

      if (internalUser) {
        setAuthSession({
          user_type: 'internal',
          user_id: internalUser.id,
          auth_id: authId,
          role: internalUser.role as InternalRole,
          partner_id: null,
          name: internalUser.name,
          email: internalUser.email,
        });
        return;
      }

      // Check partner users
      const { data: partnerUser } = await supabase
        .from('users_partner')
        .select('*')
        .eq('auth_id', authId)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerUser) {
        setAuthSession({
          user_type: 'partner',
          user_id: partnerUser.id,
          auth_id: authId,
          role: partnerUser.role as PartnerRole,
          partner_id: partnerUser.partner_id,
          name: partnerUser.name,
          email: partnerUser.email,
        });
        return;
      }

      // No profile found
      setAuthSession(defaultAuthSession);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthSession(defaultAuthSession);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setAuthSession(defaultAuthSession);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthSession(defaultAuthSession);
  };

  const refreshSession = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        authSession,
        isLoading,
        isAuthenticated: !!user && !!authSession.user_type,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
