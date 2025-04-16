import {Injectable} from '@angular/core';
import {ConfigService} from "../config/config.service";
import {CapacitorHttp, HttpResponse} from '@capacitor/core';
import {Preferences} from "@capacitor/preferences";
import {formatCurrency} from "@angular/common";
import {BehaviorSubject} from "rxjs";

export interface RateObj {
  code: string;
  name: string;
  rate: number;
}

export type RateResponse = RateObj | undefined;

const API_HOST = 'bitpay.com';
const API_PATH = '/rates';
const USER_AGENT = 'simple-wallet/1.0.0';

@Injectable({
  providedIn: 'root'
})
export class RateService {
  private FIAT_RATE: string = 'fiat_rate';
  private currentFiatRateObs = new BehaviorSubject<RateResponse>(undefined);
  currentFiatRate$ = this.currentFiatRateObs.asObservable();

  constructor(public config: ConfigService) {
    this.getFiatRate().then((value) => {
      if (value) {
        this.currentFiatRateObs.next(value);
      } else {
        this.getRemoteRates().then((rate) => {
          this.currentFiatRateObs.next(rate);
          this.setFiatRate(rate);
        });
      }
    });
  }

  public refreshExchangeRates = async() => {
    this.getRemoteRates().then((rate) => {
      this.currentFiatRateObs.next(rate);
      this.setFiatRate(rate);
    });
  }

  private setFiatRate = (value: RateResponse) => {
    Preferences.set({
      key: this.FIAT_RATE,
      value: JSON.stringify(value || ''),
    });
  }

  private getFiatRate = async (): Promise<RateResponse> => {
    const { value } = await Preferences.get({ key: this.FIAT_RATE });
    return value ? JSON.parse(value) : undefined;
  };

  public fiatCurrencyStr = (satoshis: number): string => {
    if (!this.currentFiatRateObs.value) {
      return '';
    }
    const btcValue = satoshis / 1e8;
    const fiatValue = btcValue * this.currentFiatRateObs.value.rate;
    return formatCurrency(fiatValue, 'en', '$', 'USD', '1.2-2');
  }

  public async getRemoteRates(): Promise<RateResponse> {
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
      return response.data.data;
    } else {
      console.error('Error fetching rates:', response);
      return;
    }
  }
}
