import {Component, OnInit} from '@angular/core';
import {ActionSheetController, IonicModule, Platform, ToastController} from '@ionic/angular';
import {DisclaimerComponent} from '../components/disclaimer/disclaimer.component';
import {ThemeService} from '../services/theme/theme.service';
import {WalletService} from '../services/wallet/wallet.service';
import {ConfigService} from "../services/config/config.service";
import {Router} from "@angular/router";
import {NgIf} from "@angular/common";
import {Toast} from "@capacitor/toast";

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonicModule, DisclaimerComponent, NgIf],
})
export class SettingsPage implements OnInit {
  public darkMode: boolean;
  public balanceHidden: boolean = false;
  public isModalDisclaimerOpen: boolean = false;
  public isDevice = this.platform.is('capacitor');

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private toastCtrl: ToastController,
    public actionSheetController: ActionSheetController,
    public walletService: WalletService,
    public platform: Platform,
    public configService: ConfigService,
  ) {
    this.darkMode = this.themeService.isDark;
    configService.checkBalanceHidden().then((value) => {
      this.balanceHidden = value === 'true' ? true : false;
    });
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

  public toggleShowBalance() {
    this.balanceHidden = !this.balanceHidden;
    this.configService.setBalanceHidden(this.balanceHidden ? 'true' : 'false');
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
            if (this.isDevice) {
              await Toast.show({
                text: 'Wallet deleted successfully',
                duration: 'long'
              });
            } else {
              const toast = await this.toastCtrl.create({
                message: 'Wallet deleted successfully',
                duration: 2500,
                position: 'bottom'
              });
              await toast.present();
            }
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

  public async clearTransactions() {
    const actionSheetTx = await this.actionSheetController.create({
      header: 'Confirm clear all transactions?',
      buttons: [
        {
          text: 'Confirm',
          role: 'destructive',
          icon: 'trash',
          handler: async () => {
            await this.walletService.clearTransactions();
            console.log('Transactions deleted');
            if (this.isDevice) {
              await Toast.show({
                text: 'Transactions deleted successfully',
                duration: 'long'
              });
            } else {
              const toast = await this.toastCtrl.create({
                message: 'Transactions deleted successfully',
                duration: 2500,
                position: 'bottom'
              });
              await toast.present();
            }
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
    await actionSheetTx.present();
  }
}
