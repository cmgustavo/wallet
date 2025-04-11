import { Injectable } from '@angular/core';
import {Preferences} from "@capacitor/preferences";
import {BehaviorSubject} from "rxjs";
import {DEFAULT_FIAT_CURRENCY} from "../../constants";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private DISCLAIMER_STORAGE: string = 'disclaimer';
  private APP_BALANCE_STORAGE: string = 'app_balance';
  private APP_CURRENCY_STORAGE: string = 'app_currency';
  private balanceHidden = new BehaviorSubject<string>('false');
  balance$ = this.balanceHidden.asObservable();

  constructor() {
    this.checkBalanceHidden().then((value) => {
      this.balanceHidden.next(value || 'false');
    });
    this.setAppCurrency(DEFAULT_FIAT_CURRENCY);
  }

  public setBalanceHidden = (value: string) => {
    this.balanceHidden.next(value);
    Preferences.set({
      key: this.APP_BALANCE_STORAGE,
      value: value,
    });
  };

  public checkBalanceHidden = async (): Promise<string|null> => {
    const { value } = await Preferences.get({ key: this.APP_BALANCE_STORAGE });
    return value;
  };

  public acceptDisclaimer = (value: string) => {
    Preferences.set({
      key: this.DISCLAIMER_STORAGE,
      value: value,
    });
  };
  public checkDisclaimer = async (): Promise<boolean|null> => {
    const { value } = await Preferences.get({ key: this.DISCLAIMER_STORAGE });
    return !!value;
  };
  public cleanDisclaimer = async () => {
    await Preferences.remove({ key: this.DISCLAIMER_STORAGE });
  };

  public setAppCurrency = (value: string) => {
    Preferences.set({
      key: this.APP_CURRENCY_STORAGE,
      value: value,
    });
  }

  public getAppCurrency = async (): Promise<string> => {
    const { value } = await Preferences.get({ key: this.APP_CURRENCY_STORAGE });
    return value || DEFAULT_FIAT_CURRENCY;
  };
}
