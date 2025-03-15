import {Component, EnvironmentInjector, inject} from '@angular/core';
import {IonicModule, Platform} from '@ionic/angular';
import {CommonModule} from '@angular/common';
import {ThemeService} from "./services/theme/theme.service";
import {StatusBar, Style} from '@capacitor/status-bar';

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
      const isDevice = this.platform.is('capacitor');
      const isDark = this.themeService.isDark;
      // Set dark mode
      document.body.classList.toggle('dark', isDark);
      if (isDevice) {
        StatusBar.setStyle({style: isDark ? Style.Light : Style.Dark});
      }
    });
  }
}
