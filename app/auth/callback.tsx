import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Handle the OAuth callback
    // The actual OAuth flow is handled by expo-auth-session
    // This route is just for handling any additional logic after auth
    
    // Redirect to the main app
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1000);
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