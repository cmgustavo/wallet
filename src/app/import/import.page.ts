import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform, ToastController} from '@ionic/angular';
import {Network, WalletService} from "../services/wallet/wallet.service";
import {Router} from "@angular/router";
import {Toast} from "@capacitor/toast";
import {IS_TESTNET} from "../constants";

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
    private toastCtrl: ToastController,
    public walletService: WalletService,
    public platform: Platform,
  ) {
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
    });
    await toast.present();
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
      await this.walletService.updateTotalBalance();
      await this.walletService.updateTransactions();
      this.showProgress = false;
      await this.presentToast('Wallet imported successfully');
    }).catch(async error => {
      console.log('Error importing wallet', error);
      if (this.isDevice) {
        await Toast.show({
          text: 'Error importing wallet',
          duration: 'short'
        });
      } else {
        this.toastCtrl.create({
          message: 'Error importing wallet',
          duration: 2500,
          position: 'bottom'
        }).then(toast => toast.present());
      }
    });

    this.router.navigate(['/tabs/home']);
  }

}
