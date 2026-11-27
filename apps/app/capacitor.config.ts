import type { CapacitorConfig } from '@capacitor/cli';

// ⚠ appId: no se puede cambiar después de instalar el primer APK.
const config: CapacitorConfig = {
  appId: 'com.katinails.app',
  appName: 'Katinails',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
