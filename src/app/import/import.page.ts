import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform} from '@ionic/angular';
import {Network, WalletService} from "../services/wallet/wallet.service";
import {Router} from "@angular/router";
import {IS_TESTNET} from "../constants";
import {ToastService} from "../services/toast/toast.service";

@Component({
  selector: 'app-import',
  templateUrl: './import.page.html',
  styleUrls: ['./import.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ImportPage implements OnInit {
  public mnemonic: string = '';
  public name: string = 'Bitcoin Wallet';
  public selectedNetwork: Network = IS_TESTNET ? 'testnet' : 'livenet';
  public showProgress: boolean = false;
  public isDevice = this.platform.is('capacitor');

  constructor(
    private router: Router,
    private toastService: ToastService,
    public walletService: WalletService,
    public platform: Platform,
  ) {
  }

  async ngOnInit() {
  }

  submitRequest() {
    console.log(`Mnemonic: ${this.mnemonic}`);
    console.log(`Name: ${this.name}`);
    console.log(`Network: ${this.selectedNetwork}`);

    this.showProgress = true;

    // Import wallet
    this.walletService.importWallet(this.mnemonic, this.name).then(async (wallet) => {
      console.log('Wallet imported', wallet);
      console.log('Updating wallet balance');
      await this.walletService.updateTotalBalance();
      console.log('Updating wallet transactions');
      await this.walletService.updateTransactions();
      this.showProgress = false;
      await this.toastService.presentToast('Wallet imported successfully');
      this.router.navigate(['/tabs/home']);
    }).catch(async error => {
      console.log('Error importing wallet', error);
      await this.toastService.presentToast('Error importing wallet');
    });

  }

}
