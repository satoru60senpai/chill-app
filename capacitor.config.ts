import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Chill — Configuration Capacitor (génération de l'APK Android).
 * Le build APK utilise l'export statique hors-ligne (webDir: 'out') :
 * le catalogue est embarqué et les données utilisateur restent sur l'appareil.
 */
const config: CapacitorConfig = {
  appId: 'com.ndsoftware.chill',
  appName: 'Chill',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
