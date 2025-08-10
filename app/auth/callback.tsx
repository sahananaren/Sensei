import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Auth Callback: Processing OAuth callback...');
        
        // Get the initial URL that opened the app
        const url = await Linking.getInitialURL();
        console.log('🔐 Auth Callback: Initial URL:', url);
        
        if (url && url.includes('#access_token=')) {
          // Parse the URL fragments manually
          const fragment = url.split('#')[1];
          const params = new URLSearchParams(fragment);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const expiresIn = params.get('expires_in');
          const tokenType = params.get('token_type');
          
          console.log('🔐 Auth Callback: Parsed tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            expiresIn,
            tokenType
          });
          
          if (accessToken && refreshToken) {
            // Set the session manually using the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            console.log('🔐 Auth Callback: Set session result:', {
              hasSession: !!data.session,
              error,
              user: data.session?.user?.email
            });
            
            if (error) {
              console.error('🔐 Auth Callback: Error setting session:', error);
              router.replace('/auth');
              return;
            }
            
            if (data.session) {
              console.log('✅ Auth Callback: Session established successfully');
              router.replace('/(tabs)');
              return;
            }
          }
        }
        
        // Fallback: check for existing session
        const { data, error } = await supabase.auth.getSession();
        
        console.log('🔐 Auth Callback: Fallback session check:', { 
          hasSession: !!data.session, 
          error,
          user: data.session?.user?.email 
        });
        
        if (data.session) {
          console.log('✅ Auth Callback: Session found, navigating to app');
          router.replace('/(tabs)');
        } else {
          console.log('❌ Auth Callback: No session found, redirecting to auth');
          router.replace('/auth');
        }
      } catch (error) {
        console.error('🔐 Auth Callback: Unexpected error:', error);
        router.replace('/auth');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#329BA4" />
      <Text style={styles.text}>Completing sign-in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 16,
  },
}); 