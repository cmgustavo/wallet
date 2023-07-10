import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {QrCodeModule} from "ng-qrcode";
import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-receive',
  templateUrl: './receive.page.html',
  styleUrls: ['./receive.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, QrCodeModule],
})
export class ReceivePage implements OnInit {
  constructor(public walletService: WalletService, public platform: Platform) {
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

  public copyAddress = async () => {
    const address = this.walletService.getLastAddress();
    if (address) {
      console.log('Copied address: ', address.address);
      if (this.platform.is('capacitor')) {
        await Clipboard.write({string: address.address});
      } else {
        await navigator.clipboard.writeText(address.address);
      }
    }
  }
}
