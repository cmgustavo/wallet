import {Component, EnvironmentInjector, inject, NgModule} from '@angular/core';
import { IonicModule, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {ThemeService} from "./services/theme/theme.service";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AppComponent {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(private platform: Platform, private themeService: ThemeService) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Set dark mode
      document.body.classList.toggle('dark', this.themeService.isDark);
    });
  }
}
