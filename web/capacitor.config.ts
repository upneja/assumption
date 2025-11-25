import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'lol.pregame.app',
  appName: 'pregame.lol',
  webDir: 'out',
  server: {
    // For development, you can set androidScheme and iosScheme
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
