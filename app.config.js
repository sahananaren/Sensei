  export default {
    expo: {
      name: "Sensei",
      slug: "Sensei",
      version: "1.1.1",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "com.sahananarenx.Sensei",
      userInterfaceStyle: "automatic",
      newArchEnabled: false,
      
      // Add splash screen configuration
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        backgroundColor: "#0A0A0A"
      },
      
      ios: {
        supportsTablet: true,
        // Add notification permissions for iOS
        infoPlist: {
          UIBackgroundModes: ["remote-notification"]
        }
      },
      web: {
        bundler: "metro",
        output: "single",
        favicon: "./assets/images/favicon.png"
      },
      plugins: [
        "expo-router",
        "expo-font",
        "expo-web-browser",
        // Add notifications plugin
        [
          "expo-notifications",
          {
            icon: "./assets/images/icon.png",
            color: "#ffffff"
          }
        ]
      ],
      experiments: {
        typedRoutes: true
      },
      extra: {
        router: {},
        eas: {
          projectId: "ec9b6121-50a4-4517-9316-349e01ba1d97"
        },
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
      owner: "sahananarenx",
      android: {
        package: "com.sahananarenx.Sensei",
        versionCode: 17, // This will be used by prebuild
        permissions: [
          "NOTIFICATIONS",
          "VIBRATE",
          "RECEIVE_BOOT_COMPLETED",
          "com.android.vending.BILLING"
        ],
        intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "com.sahananarenx.Sensei"
              }
            ],
            category: ["BROWSABLE", "DEFAULT"]
          }
        ]
      }
    }
  };