import { Injectable } from '@angular/core';
import {Preferences} from "@capacitor/preferences";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private DISCLAIMER_STORAGE: string = 'disclaimer';

  constructor() { }

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
}
