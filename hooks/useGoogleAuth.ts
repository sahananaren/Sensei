import { useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Updated to use web client ID
const GOOGLE_CLIENT_ID = '1047534752221-5c58pk3hnm3g9ufms4tr8q4e5303bjj7.apps.googleusercontent.com';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async (isSignUp: boolean = false) => {
    try {
      setLoading(true);
      console.log('🔐 Google Auth: Starting sign-in...');
      
      // Create discovery document for Google OAuth
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };
      
      // Use WEB redirect URI for web client
      const redirectUri = 'https://auth.expo.io/@sahananarenx/Sensei';

      // Create auth request with custom app name
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
          // Add custom app name to replace "Expo.io"
          app_name: 'Sensei',
        },
      });

      console.log('🔐 Google Auth: Redirect URI:', redirectUri);

      // Start auth session with discovery
      const result = await request.promptAsync(discovery);

      console.log('🔐 Google Auth: Result:', result);

      if (result.type === 'success') {
        console.log('🔐 Google Auth: Success, exchanging code...');
        
        // Exchange code for tokens with discovery
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_CLIENT_ID,
            code: result.params.code,
            redirectUri: redirectUri,
          },
          discovery
        );

        console.log(' Google Auth: Token response received');

        // Use ID token for Supabase
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: tokenResponse.idToken!,
        });

        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }

        console.log('✅ Google Auth: Successfully signed in to Supabase');
        return { data, error: null };
      } else {
        console.log('❌ Google Auth: User cancelled or failed');
        return { data: null, error: new Error('Google sign-in was cancelled') };
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