import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ma.palier.app",
  appName: "Palier",
  webDir: "out",
  server: {
    // In development, point to the local dev server
    // url: "http://localhost:3000",
    // cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#f5f1ea",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1e5b50",
    },
  },
  ios: {
    contentInset: "automatic",
    scheme: "Palier",
  },
  android: {
    backgroundColor: "#f5f1ea",
  },
};

export default config;
