import { useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '1047534752221-2hr66p40mr0u0q152sbgvmp4cc2pvlnp.apps.googleusercontent.com';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('🔐 Google Auth: Starting sign-in...');
      
      // Create discovery document
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      // Use EXPLICIT redirect URI instead of makeRedirectUri
      const redirectUri = 'com.sahananarenx.Sensei://auth/callback';

      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri, // Use explicit URI
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
        },
      });

      console.log('🔐 Google Auth: Redirect URI:', redirectUri);

      // Start auth session
      const result = await request.promptAsync(discovery);

      console.log('🔐 Google Auth: Result:', result);

      if (result.type === 'success') {
        console.log('🔐 Google Auth: Success, exchanging code...');
        
        // Exchange code for tokens
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_CLIENT_ID,
            code: result.params.code,
            redirectUri: redirectUri, // Use explicit URI
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