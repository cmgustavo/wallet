import { Component, ViewChild } from '@angular/core';
import { IonicModule, IonModal } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { DisclaimerComponent } from '../components/disclaimer/disclaimer.component';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonicModule, ExploreContainerComponent, DisclaimerComponent],
})
export class SettingsPage {
  public darkMode: boolean = AppComponent.darkMode;
  @ViewChild(IonModal) modal!: IonModal;

  constructor() {}

  close() {
    this.modal.dismiss();
  }

  public toggleDarkMode() {
    this.darkMode = !this.darkMode;
    document.body.classList.toggle('dark', this.darkMode);
  }
}
