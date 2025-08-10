import { useState } from 'react';

import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('🔐 Google Auth: Starting Supabase OAuth...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.sahananarenx.Sensei://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log(' Google Auth: OAuth response:', { data, error });

      if (error) {
        console.error('❌ Supabase OAuth error:', error);
        throw error;
      }

      if (!data?.url) {
        console.error('❌ No OAuth URL returned from Supabase');
        throw new Error('No OAuth URL returned from Supabase');
      }

      console.log('🔐 Google Auth: Opening OAuth URL:', data.url);
      
      const result = await WebBrowser.openAuthSessionAsync(
        data.url, 
        'com.sahananarenx.Sensei://auth/callback'
      );
      
      console.log('🔐 Google Auth: Browser result:', result);

      if (result.type === 'success' && result.url) {
        console.log('✅ Google Auth: OAuth completed successfully');
        console.log('🔐 Google Auth: Result URL:', result.url);
        
        // Parse tokens from the callback URL
        if (result.url.includes('#access_token=')) {
          const fragment = result.url.split('#')[1];
          const params = new URLSearchParams(fragment);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          console.log('🔐 Google Auth: Parsed tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken
          });
          
          if (accessToken && refreshToken) {
            // Set the session manually using the tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            console.log('🔐 Google Auth: Set session result:', {
              hasSession: !!sessionData.session,
              error: sessionError,
              user: sessionData.session?.user?.email
            });
            
            if (sessionError) {
              console.error('🔐 Google Auth: Error setting session:', sessionError);
              return { data: null, error: sessionError };
            }
            
            if (sessionData.session) {
              console.log('✅ Google Auth: Session established successfully');
              return { data: result, error: null };
            }
          }
        }
        
        // Fallback: try to get session normally
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        console.log('🔐 Google Auth: Fallback session check:', { 
          hasSession: !!sessionData.session, 
          sessionError,
          user: sessionData.session?.user?.email 
        });
        
        return { data: result, error: sessionError };
      } else if (result.type === 'cancel') {
        console.log('❌ Google Auth: User cancelled OAuth');
        return { data: null, error: new Error('OAuth was cancelled') };
      } else {
        console.log('❌ Google Auth: OAuth failed');
        return { data: null, error: new Error('OAuth failed') };
      }
    } catch (error) {
      console.error('❌ Google Auth Error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading };
} 