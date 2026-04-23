import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.simiaiclaw.lobster',
  appName: '龙虾集群控制台',
  webDir: '../dist/client',
  backgroundColor: '#0a0e1a',
  android: {
    backgroundColor: '#0a0e1a',
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: '#0a0e1a',
    allowsLinkPreview: true,
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0e1a',
    },
  },
};

export default config;
