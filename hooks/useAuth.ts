import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    console.log('🔐 useAuth: Initializing authentication...');

    // Get initial session with proper error handling
    const initializeAuth = async () => {
      try {
        console.log('🔐 useAuth: Checking for existing session...');
        setLoading(true);
        
        // Check what's in AsyncStorage
        const storedSession = await AsyncStorage.getItem('supabase.auth.token');
        console.log('🔐 AsyncStorage session:', storedSession ? 'Found' : 'Not found');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 useAuth: Error getting session:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
          }
        } else {
          console.log('🔐 useAuth: Session check result:', session ? 'Found session' : 'No session');
          if (isMounted) {
            setSession(session);
            const newUser = session?.user ?? null;
            setUser(prevUser => {
              // Only update if user ID actually changed
              if (prevUser?.id !== newUser?.id) {
                return newUser;
              }
              return prevUser;
            });
          }
        }
      } catch (error) {
        console.error('🔐 useAuth: Failed to initialize auth:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          console.log('🔐 useAuth: Setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 useAuth: Auth state changed:', event, session ? 'Has session' : 'No session');
      
      if (isMounted) {
        setSession(session);
        const newUser = session?.user ?? null;
        setUser(prevUser => {
          // Only update if user ID actually changed
          if (prevUser?.id !== newUser?.id) {
            return newUser;
          }
          return prevUser;
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const refreshSession = async () => {
      try {
        // First check if we have a current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          console.log('🔐 useAuth: No session to refresh, skipping...');
          return;
        }

        // Check if session is close to expiring (within 5 minutes)
        const expiresAt = currentSession.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
        
        if (timeUntilExpiry > 300) { // More than 5 minutes left
          console.log('🔐 useAuth: Session still valid, no refresh needed');
          return;
        }

        // Try to refresh the session to keep user logged in
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('🔐 useAuth: Session refresh failed:', error);
          // Don't clear the session - keep user logged in even if refresh fails
          // The app will continue to work with the current session/user data
          console.log('🔐 useAuth: Keeping user logged in despite refresh failure');
        } else {
          console.log('🔐 useAuth: Session refreshed successfully');
        }
      } catch (error) {
        console.error('🔐 useAuth: Session refresh error:', error);
        // Don't clear session - keep user logged in
        console.log('🔐 useAuth: Keeping user logged in despite refresh error');
      }
    };

    // Check session every 5 minutes to attempt refresh if needed
    const interval = setInterval(refreshSession, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 useAuth: Attempting sign in...');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('🔐 useAuth: Sign in result:', error ? 'Error' : 'Success');
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('🔐 useAuth: Attempting sign up...');
    setLoading(true);
    
    try {
      const signUpData: any = {
        email,
        password,
      };
      
      if (fullName) {
        signUpData.options = {
          data: {
            full_name: fullName,
          },
        };
      }
      
      const { data, error } = await supabase.auth.signUp(signUpData);
      console.log('🔐 useAuth: Sign up result:', error ? 'Error' : 'Success');
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🔐 useAuth: Attempting sign out...');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        // Explicitly clear local state if Supabase signOut reports no error
        // This helps ensure the UI reacts immediately even if onAuthStateChange is delayed
        setSession(null);
        setUser(null);
        console.log('🔐 useAuth: Sign out successful');
      } else {
        console.error('🔐 useAuth: Sign out error:', error);
      }
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Log current state for debugging
  useEffect(() => {
    console.log('🔐 useAuth: Current state -', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      userEmail: user?.email
    });
  }, [user, session, loading]);

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}