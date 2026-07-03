import {Component, EnvironmentInjector, inject} from '@angular/core';
import {IonicModule, Platform} from '@ionic/angular';
import {CommonModule} from '@angular/common';
import {ThemeService} from "./services/theme/theme.service";

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    imports: [IonicModule, CommonModule]
})
export class AppComponent {
  private platform = inject(Platform);
  private themeService = inject(ThemeService);

  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      const isDark = this.themeService.isDark;
      // Set dark mode
      document.body.classList.toggle('dark', isDark);
    });
  }
}
