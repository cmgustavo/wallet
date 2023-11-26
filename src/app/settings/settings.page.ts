import {Component, OnInit} from '@angular/core';
import {ActionSheetController, IonicModule, ToastController} from '@ionic/angular';
import {DisclaimerComponent} from '../components/disclaimer/disclaimer.component';
import {ThemeService} from '../services/theme/theme.service';
import {WalletService} from '../services/wallet/wallet.service';
import {Router} from "@angular/router";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonicModule, DisclaimerComponent, NgIf],
})
export class SettingsPage implements OnInit {
  public darkMode: boolean;
  public isModalDisclaimerOpen: boolean = false;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private toastCtrl: ToastController,
    public actionSheetController: ActionSheetController,
    public walletService: WalletService
  ) {
    this.darkMode = this.themeService.isDark;
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

  openBackup() {
    this.router.navigate(['/tabs/settings/backup']);
  }

  openAddress() {
    this.router.navigate(['/tabs/settings/address']);
  }

  openTransaction() {
    this.router.navigate(['/tabs/settings/transaction']);
  }

  close() {
    this.isModalDisclaimerOpen = false;
  }

  showDisclaimer() {
    this.isModalDisclaimerOpen = true;
  }

  public toggleDarkMode() {
    this.darkMode = !this.darkMode;
    this.themeService.set(this.darkMode ? 'dark' : 'light');
  }

  public async deleteWallet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Confirm delete current Wallet?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: async () => {
            await this.walletService.deleteWallet();
            console.log('Wallet deleted');
            const toast = await this.toastCtrl.create({
              message: 'Wallet deleted successfully',
              duration: 2500,
              position: 'middle'
            });
            await toast.present();
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            // Nothing to do, action sheet is automatically closed
          },
        },
      ],
    });
    await actionSheet.present();
  }
}
