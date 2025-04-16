import {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.simplewalletng',
  appName: 'SimpleWallet',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#1a1a1a',
    },
  },
};

export default config;
