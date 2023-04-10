import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AppComponent {
  public environmentInjector = inject(EnvironmentInjector);
  static darkMode: boolean = false;

  constructor(private platform: Platform) {
    this.initializeApp();
  }

  setDarkMode(shouldAdd: boolean) {
    AppComponent.darkMode = shouldAdd;
    document.body.classList.toggle('dark', shouldAdd);
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.setDarkMode(prefersDark.matches);
      prefersDark.addListener((e) => this.setDarkMode(e.matches));
    });
  }
}
