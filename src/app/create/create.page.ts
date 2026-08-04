import { Component, inject } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform} from '@ionic/angular';
import {WalletService, Network} from "../services/wallet/wallet.service";
import {Router} from "@angular/router";
import {IS_TESTNET} from "../constants";
import {ToastService} from "../services/toast/toast.service";

@Component({
    selector: 'app-create',
    templateUrl: './create.page.html',
    styleUrls: ['./create.page.scss'],
    imports: [IonicModule, CommonModule, FormsModule]
})
export class CreatePage {
  private router = inject(Router);
  private toastService = inject(ToastService);
  walletService = inject(WalletService);
  platform = inject(Platform);

  public name: string = 'Bitcoin Wallet';
  public selectedNetwork: Network = IS_TESTNET ? 'testnet' : 'livenet';
  public showProgress: boolean = false;

  submitRequest() {
    // Generate the recovery phrase in memory only. Nothing is persisted until
    // the user confirms the backup and sets a PIN on the Backup screen.
    const mnemonic = this.walletService.generateNewMnemonic();
    this.router.navigate(['/tabs/settings/backup'], {
      state: {firstTime: true, mnemonic, name: this.name},
    });
  }

}
