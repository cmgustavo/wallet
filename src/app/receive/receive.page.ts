import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {QrCodeModule} from "ng-qrcode";

@Component({
  selector: 'app-receive',
  templateUrl: './receive.page.html',
  styleUrls: ['./receive.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, QrCodeModule],
})
export class ReceivePage implements OnInit {
  constructor(public walletService: WalletService) {
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

  public copyAddress = async () => {
    const address = this.walletService.getLastAddress();
    if (address) {
      console.log('##### address.address', address.address);
      await navigator.clipboard.writeText(address.address);
    }
  }
}
