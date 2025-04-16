import { CapacitorConfig } from '@capacitor/cli';
import {ThemeService} from "./src/app/services/theme/theme.service";

const themeService: ThemeService = new ThemeService();

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
      style: themeService.isDark ? 'DARK' : 'LIGHT',
      backgroundColor: themeService.isDark ? '#1a1a1a' : '#e8e8e8',
    },
  },
};

export default config;
