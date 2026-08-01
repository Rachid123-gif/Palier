import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ma.palier.app",
  appName: "Palier",
  webDir: "out",
  server: {
    url: "https://palier.ma",
    cleartext: false,
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
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#f5f1ea",
  },
};

export default config;
