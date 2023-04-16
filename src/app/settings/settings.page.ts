import { Component, ViewChild } from '@angular/core';
import { IonicModule, IonModal } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { DisclaimerComponent } from '../components/disclaimer/disclaimer.component';
import {ThemeService} from "../services/theme/theme.service";

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonicModule, ExploreContainerComponent, DisclaimerComponent],
})
export class SettingsPage {
  public darkMode: boolean;
  @ViewChild(IonModal) modal!: IonModal;

  constructor(private themeService: ThemeService) {
    this.darkMode = this.themeService.isDark;
  }

  close() {
    this.modal.dismiss();
  }
  public toggleDarkMode() {
    this.darkMode = !this.darkMode;
    this.themeService.set(this.darkMode ? 'dark' : 'light');
  }
}
