import {Component, OnInit} from '@angular/core';
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
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CreatePage implements OnInit {
  public name: string = 'Bitcoin Wallet';
  public selectedNetwork: Network = IS_TESTNET ? 'testnet' : 'livenet';
  public showProgress: boolean = false;

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
    console.log(`Name: ${this.name}`);
    console.log(`Network: ${this.selectedNetwork}`);

    this.showProgress = true;
    // Create wallet
    this.walletService.createWallet(this.name).then(async (wallet) => {
      console.log('Wallet created', wallet);
      this.showProgress = false;
      await this.toastService.presentToast('Wallet created successfully');
    });

    this.router.navigate(['/tabs/home']);
  }

}
