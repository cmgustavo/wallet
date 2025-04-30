import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {QrCodeModule} from "ng-qrcode";
import {Clipboard} from '@capacitor/clipboard';
import {Share} from "@capacitor/share";
import {ToastService} from "../services/toast/toast.service";

@Component({
  selector: 'app-receive',
  templateUrl: './receive.page.html',
  styleUrls: ['./receive.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, QrCodeModule],
})
export class ReceivePage implements OnInit {
  public isDevice = this.platform.is('capacitor');

  constructor(
    public walletService: WalletService,
    public platform: Platform,
    private toastService: ToastService) {
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

  public async shareAddress() {
    const address = this.walletService.getLastAddress();
    if (address) {
      console.log('Shared address: ', address.address);
      if (this.isDevice) {
        await Share.share({
          title: 'Bitcoin Address',
          text: address.address,
          dialogTitle: 'Share your Bitcoin Address'
        });
      }
    }
  }

  public copyAddress = async () => {
    const address = this.walletService.getLastAddress().address;
    if (address) {
      if (this.isDevice) {
        await Clipboard.write({string: address});
      } else {
        await navigator.clipboard.writeText(address);
      }
      console.log('Copied address: ', address);
      await this.toastService.presentToast('Copied to clipboard!');
    }
  }
}
