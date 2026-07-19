import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.octavestreaming.music',
  appName: 'Octave Music',
  webDir: 'www',
  backgroundColor: '#0b0b13',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Force the WebView to behave like a normal browser tab so external
    // navigation to music.octavestreaming.com works seamlessly.
    initialFocus: true,
  },
  server: {
    // Local webDir is the entry. We then navigate to the live URL at runtime
    // when the device is online, and fall back to the bundled offline UI
    // when the WebView fails to load (handled by a custom Android WebViewClient).
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0b0b13',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#a855f7',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0b13',
      overlaysWebView: false,
    },
    CapacitorBrowser: {
      // Use the in-app WebView browser, NOT the system browser, so users stay
      // inside the app shell.
    },
  },
};

export default config;
