import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.simplewalletng',
  appName: 'SimpleWallet',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
