import {Component, OnInit} from '@angular/core';
import {ActionSheetController, IonicModule, Platform, ToastController} from '@ionic/angular';
import {DisclaimerComponent} from '../components/disclaimer/disclaimer.component';
import {ThemeService} from '../services/theme/theme.service';
import {WalletService} from '../services/wallet/wallet.service';
import {ConfigService} from "../services/config/config.service";
import {AddressbookService} from "../services/addressbook/addressbook.service";
import {Router} from "@angular/router";
import {formatCurrency, NgIf} from "@angular/common";
import {Toast} from "@capacitor/toast";
import {IS_TESTNET} from "../constants";
import {RateService} from "../services/rates/rates.service";
import {RateResponse} from "../services/rates/rates.service";

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
  public selectedNetwork = IS_TESTNET ? 'testnet' : 'livenet';
  private isDark = this.themeService.isDark;
  public fiatRate: RateResponse = undefined;
  public fiatRateValueStr : string = '';

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private toastCtrl: ToastController,
    public actionSheetController: ActionSheetController,
    public walletService: WalletService,
    public platform: Platform,
    public configService: ConfigService,
    public addressbookService: AddressbookService,
    public rateService: RateService,
  ) {
    this.darkMode = this.themeService.isDark;
    configService.checkBalanceHidden().then((value) => {
      this.balanceHidden = value === 'true' ? true : false;
    });
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
    this.rateService.currentFiatRate$.subscribe((value) => {
      if (!value) {
        return;
      }
      this.fiatRate = value;
      this.fiatRateValueStr = formatCurrency(value.rate, 'en', '', value.code);
    });
  }

  openAddressbook() {
    this.router.navigate(['/tabs/settings/addressbook']);
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

  public async refreshExchangeRate() {
    await this.rateService.refreshExchangeRates();
  }

  public toggleDarkMode() {
    this.darkMode = !this.darkMode;
    this.themeService.set(this.darkMode ? 'dark' : 'light');
  }

  public toggleShowBalance() {
    this.balanceHidden = !this.balanceHidden;
    this.configService.setBalanceHidden(this.balanceHidden ? 'true' : 'false');
  }

  public async removeAllContacts() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Confirm delete all contacts?',
      cssClass: this.isDark ? 'dark-action-sheet' : '',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: async () => {
            await this.addressbookService.clearAddressBook();
            console.log('Address book deleted');
            if (this.isDevice) {
              await Toast.show({
                text: 'Address book deleted successfully',
                duration: 'long'
              });
            } else {
              const toast = await this.toastCtrl.create({
                message: 'Address book deleted successfully',
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

  public async deleteWallet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Confirm delete current Wallet?',
      cssClass: this.isDark ? 'dark-action-sheet' : '',
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
      cssClass: this.isDark ? 'dark-action-sheet' : '',
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

  public async clearProposals() {
    const actionSheetTx = await this.actionSheetController.create({
      header: 'Confirm clear all proposals?',
      cssClass: this.isDark ? 'dark-action-sheet' : '',
      buttons: [
        {
          text: 'Confirm',
          role: 'destructive',
          icon: 'trash',
          handler: async () => {
            await this.walletService.clearProposals();
            console.log('Proposals deleted');
            if (this.isDevice) {
              await Toast.show({
                text: 'Proposals deleted successfully',
                duration: 'long'
              });
            } else {
              const toast = await this.toastCtrl.create({
                message: 'Proposals deleted successfully',
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
