import { useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Configure AuthSession
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '1047534752221-2hr66p40mr0u0q152sbgvmp4cc2pvlnp.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'myapp',
  path: '/auth/callback'
});

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    
    try {
      console.log('🔐 Google Auth: Starting Google sign-in...');
      
      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: GOOGLE_REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
        },
      });

      console.log('🔐 Google Auth: Redirect URI:', GOOGLE_REDIRECT_URI);

      // Start auth session
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
      });

      console.log('🔐 Google Auth: Auth result type:', result.type);

      if (result.type === 'success') {
        console.log('🔐 Google Auth: Auth successful, exchanging code for tokens...');
        
        // Exchange code for tokens
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_CLIENT_ID,
            code: result.params.code,
            redirectUri: GOOGLE_REDIRECT_URI,
            extraParams: {
              code_verifier: request.codeVerifier!,
            },
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        console.log('🔐 Google Auth: Token exchange successful, signing in with Supabase...');

        // Sign in with Supabase using Google token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: tokenResponse.accessToken,
        });

        if (error) {
          console.error('🔐 Google Auth: Supabase sign-in error:', error);
          throw error;
        }

        console.log('🔐 Google Auth: Sign-in successful!');
        return { data, error: null };
      } else {
        console.log('🔐 Google Auth: Auth was cancelled or failed');
        return { data: null, error: new Error('Google sign-in was cancelled') };
      }
    } catch (error) {
      console.error('🔐 Google Auth: Error during sign-in:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading,
  };
} 