import {Injectable} from '@angular/core';
import {ConfigService} from "../config/config.service";
import {CapacitorHttp, HttpResponse} from '@capacitor/core';

export interface RateObj {
  code: string;
  name: string;
  rate: number;
}

export type RateResponse = RateObj | undefined;

/**
 * API-related constants and options for performance and security.
 */
const API_HOST = 'bitpay.com';
const API_PATH = '/rates';
const USER_AGENT = 'simple-wallet/1.0.0';

@Injectable({
  providedIn: 'root'
})
export class RateService {
  public currentRate: RateResponse;

  constructor(public config: ConfigService) {
  }

  public async getRates(): Promise<RateResponse> {
    if (this.currentRate) {
      return this.currentRate;
    }
    const currency = await this.config.getAppCurrency();
    const url = `https://${API_HOST}${API_PATH}/${currency.toUpperCase()}`;
    const headers = {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    };
    const options = {
      url,
      headers,
    };
    const response: HttpResponse = await CapacitorHttp.get(options);
    if (response.status === 200) {
      this.currentRate = response.data.data;
      return response.data.data;
    } else {
      console.error('Error fetching rates:', response);
      return;
    }
  }
}
