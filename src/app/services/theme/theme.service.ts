import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private THEME_STORAGE: string = 'theme';
  public isDark: boolean = false;
  public theme: string|null = null;

  constructor() {
    this.get().then((theme) => {
      if (theme && theme === 'dark') {
        this.setDarkMode(true);
      } else if (theme && theme === 'light') {
        this.setDarkMode(false);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.setDarkMode(prefersDark.matches);
        prefersDark.addListener((e) => this.setDarkMode(e.matches));
      }
    });
  }

  private setDarkMode(shouldAdd: boolean) {
    this.isDark = shouldAdd;
    document.body.classList.toggle('dark', shouldAdd);
  }

  public set = (value: string) => {
    this.theme = value;
    this.setDarkMode(value === 'dark');
    Preferences.set({
      key: this.THEME_STORAGE,
      value: value,
    });
  };
  public get = async (): Promise<string|null> => {
    const { value } = await Preferences.get({ key: this.THEME_STORAGE });
    return value;
  };
  public clean = async () => {
    await Preferences.remove({ key: this.THEME_STORAGE });
  };
}
