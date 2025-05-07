import {Component, Input} from '@angular/core';
import {IonicModule, Platform} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {Address, WalletService} from "../../services/wallet/wallet.service";
import {Clipboard} from "@capacitor/clipboard";
import {ToastService} from "../../services/toast/toast.service";

@Component({
  selector: 'app-addresses-component',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf
  ]
})
export class AddressesComponent {
  @Input() addresses: Address[] | undefined;
  public isDevice = this.platform.is('capacitor');

  constructor(public walletService: WalletService, public platform: Platform, private toastService: ToastService) {
  }

  public copyAddress = async (address: string) => {
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
