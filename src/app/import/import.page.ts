import { Component, inject } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform} from '@ionic/angular';
import {Network, WalletService} from "../services/wallet/wallet.service";
import {Router} from "@angular/router";
import {IS_TESTNET} from "../constants";
import {ToastService} from "../services/toast/toast.service";
import {PinService} from "../services/pin/pin.service";

@Component({
    selector: 'app-import',
    templateUrl: './import.page.html',
    styleUrls: ['./import.page.scss'],
    imports: [IonicModule, CommonModule, FormsModule]
})
export class ImportPage {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private pinService = inject(PinService);
  walletService = inject(WalletService);
  platform = inject(Platform);

  public mnemonic: string = '';
  public name: string = 'Bitcoin Wallet';
  public selectedNetwork: Network = IS_TESTNET ? 'testnet' : 'livenet';
  public showProgress: boolean = false;
  public isDevice = this.platform.is('capacitor');

  async submitRequest() {
    console.log(`Name: ${this.name}`);
    console.log(`Network: ${this.selectedNetwork}`);

    // Capture the phrase and clear it from the screen right away, so it isn't
    // left visible on the device while the (slow) network scan runs.
    const mnemonic = this.mnemonic.trim();
    this.mnemonic = '';

    // Ask for a PIN before scanning: it encrypts the private key so the
    // imported recovery phrase is never stored in the clear.
    const pin = await this.pinService.setPin();
    if (!pin) {
      // Cancelled: restore the phrase so the user can keep editing.
      this.mnemonic = mnemonic;
      return;
    }

    this.showProgress = true;

    try {
      await this.walletService.importWallet(mnemonic, this.name, pin);
      console.log('Updating wallet balance');
      await this.walletService.updateTotalBalance();
      console.log('Updating wallet transactions');
      await this.walletService.updateTransactions();
      this.showProgress = false;
      await this.toastService.presentToast('Wallet imported successfully');
      await this.router.navigate(['/tabs/home']);
    } catch (error) {
      console.log('Error importing wallet', error);
      this.showProgress = false;
      // Restore so a typo can be fixed; the scan is over, nothing is lingering.
      this.mnemonic = mnemonic;
      await this.toastService.presentToast('Error importing wallet');
    }
  }

}
