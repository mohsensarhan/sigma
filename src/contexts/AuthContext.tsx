/**
 * TruPath V1 - Authentication Context
 *
 * Provides authentication state management for donor accounts.
 * Handles sign up, sign in, sign out, and session persistence.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { AuthUser, DonorProfile } from '../types/database';

interface AuthContextType {
  user: AuthUser | null;
  donorProfile: DonorProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name?: string,
    phone?: string
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<DonorProfile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user session and profile on mount
  useEffect(() => {
    async function loadSession() {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await loadDonorProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (session?.user) {
        setUser(session.user);
        await loadDonorProfile(session.user.id);
      } else {
        setUser(null);
        setDonorProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load donor profile from database
  const loadDonorProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('donor_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          await createDonorProfile(userId);
        } else {
          console.error('Error loading donor profile:', error);
        }
        return;
      }

      setDonorProfile(data);
    } catch (error) {
      console.error('Error loading donor profile:', error);
    }
  };

  // Create donor profile for new user
  const createDonorProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser(userId);
      const user = userData.user;

      if (!user) {return;}

      const newProfile: Partial<DonorProfile> = {
        id: userId,
        email: user.email || '',
        name: user.user_metadata?.name,
        phone: user.user_metadata?.phone || user.phone,
        total_donations_amount: 0,
        total_donations_count: 0,
        total_meals_provided: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('donor_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating donor profile:', error);
      } else {
        setDonorProfile(data);
      }
    } catch (error) {
      console.error('Error creating donor profile:', error);
    }
  };

  // Sign up new user
  const signUp = async (
    email: string,
    password: string,
    name?: string,
    phone?: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Profile will be created automatically when user confirms email
      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred during sign up.' };
    }
  };

  // Sign in existing user
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      console.log('🔐 AuthContext: signInWithPassword called for:', email);

      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 AuthContext: signInWithPassword complete, result:', result);

      if (result.error) {
        console.log('❌ AuthContext: Returning error:', result.error.message);
        return { error: result.error.message };
      }

      console.log('✅ AuthContext: Returning success (no error), user:', result.data?.user?.id);
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Exception in signIn:', error);
      return { error: 'An unexpected error occurred during sign in.' };
    }
  };

  // Sign out user
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setDonorProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred while sending reset email.' };
    }
  };

  // Update donor profile
  const updateProfile = async (
    updates: Partial<DonorProfile>
  ): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'No authenticated user' };
    }

    try {
      const { data, error } = await supabase
        .from('donor_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      setDonorProfile(data);
      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred while updating profile.' };
    }
  };

  const value: AuthContextType = {
    user,
    donorProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
