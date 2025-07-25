import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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