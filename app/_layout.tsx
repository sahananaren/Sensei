import { useEffect } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  // Load Inter font
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Debug logging for authentication state
  useEffect(() => {
    console.log('🏠 _layout: Auth state changed -', {
      hasUser: !!user,
      loading,
      userEmail: user?.email,
      currentPath: pathname,
      willShowAuth: !user && !loading,
      willShowTabs: !!user && !loading,
      willShowLoading: loading
    });
  }, [user, loading]);

  // Explicit navigation based on auth state
  useEffect(() => {
    if (loading) {
      console.log('🏠 _layout: Still loading, not redirecting');
      return;
    }

    if (!user && pathname !== '/auth') {
      console.log('🏠 _layout: No user found, redirecting to auth');
      router.replace('/auth');
    } else if (user && pathname === '/auth') {
      console.log('🏠 _layout: User found, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [user, loading, pathname]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (loading) {
    console.log('🏠 _layout: Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#329BA4" />
      </View>
    );
  }

  console.log('🏠 _layout: Rendering navigation stack');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-vision" options={{ headerShown: false }} />
        <Stack.Screen name="create-habit" options={{ headerShown: false }} />
        <Stack.Screen name="focus-session/[habitId]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});