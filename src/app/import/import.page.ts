import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, ToastController} from '@ionic/angular';
import {Network, WalletService} from "../services/wallet/wallet.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-import',
  templateUrl: './import.page.html',
  styleUrls: ['./import.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ImportPage implements OnInit {
  public mnemonic: string = '';
  public name: string = '';
  public selectedNetwork: Network = 'testnet';

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    public walletService: WalletService
  ) {
  }

  async ngOnInit() {
  }

  submitRequest() {
    console.log(`Mnemonic: ${this.mnemonic}`);
    console.log(`Name: ${this.name}`);
    console.log(`Network: ${this.selectedNetwork}`);

    const isTestnet = this.selectedNetwork === 'testnet';

    // Import wallet
    this.walletService.importWallet(this.mnemonic, isTestnet, this.name).then(async (wallet) => {
      console.log('Wallet imported', wallet);
      await this.walletService.updateTotalBalance();
      await this.walletService.updateTransactions();
      // Show toast
      const toast = await this.toastCtrl.create({
        message: 'Wallet imported successfully',
        duration: 2500,
        position: 'top'
      });
      await toast.present();
    }).catch(error => {
      console.log('Error importing wallet', error);
      // Show toast
      this.toastCtrl.create({
        message: error,
        duration: 2500,
        position: 'top'
      }).then(toast => toast.present());
    });

    this.router.navigate(['/tabs/home']);
  }

}
