import { environment } from '../environments/environment';

export const API_ENDPOINT = environment.apiURL;
export const IS_DEV_MODE = !environment.production;
export const IS_TESTNET = environment.isTestnet;
