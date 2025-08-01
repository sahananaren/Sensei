  export default {
    expo: {
      name: "Sensei",
      slug: "Sensei",
      version: "1.1.1",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "myapp",
      userInterfaceStyle: "automatic",
      newArchEnabled: false,
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
        }
      },
      owner: "sahananarenx",
      android: {
        package: "com.sahananarenx.Sensei",
        permissions: [
          "NOTIFICATIONS",
          "VIBRATE",
          "RECEIVE_BOOT_COMPLETED"
        ],
        // Google OAuth configuration
        intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "myapp"
              }
            ],
            category: ["BROWSABLE", "DEFAULT"]
          }
        ]
      }
    }
  };