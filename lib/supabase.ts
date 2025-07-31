import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables with fallback to app.config.js
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;

// Enhanced debugging
console.log('🔧 Supabase Config Debug:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0,
  urlStart: supabaseUrl?.substring(0, 10) + '...',
  keyStart: supabaseAnonKey?.substring(0, 10) + '...',
  fromEnv: {
    url: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    key: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  fromConstants: {
    url: !!Constants.expoConfig?.extra?.supabaseUrl,
    key: !!Constants.expoConfig?.extra?.supabaseAnonKey,
  }
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing or empty:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing',
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '[REDACTED]' : 'undefined'
  });
  throw new Error(
    'Missing Supabase environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file and restart your Expo development server. Check the console for more details.'
  );
}

console.log('✅ Supabase configuration loaded successfully');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});