import {Component, Input} from '@angular/core';
import {Transaction} from "../../services/wallet/wallet.service";
import {IonicModule, Platform} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {Browser} from "@capacitor/browser";

@Component({
  selector: 'app-transaction-details-component',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf,
  ]
})
export class TransactionDetailsComponent {
  public isDevice = this.platform.is('capacitor');
  @Input() tx: Transaction | undefined;
  @Input() network: string | undefined;
  constructor(public platform: Platform) {
  }

  public async openExplorer() {
    const isTestnet = this.network === 'testnet';
    const url = `https://blockstream.info/${isTestnet ? 'testnet/' : ''}tx/${this.tx?.id}`;
    if (this.tx) {
      if (this.isDevice) {
        await Browser.open({url});
      } else {
        window.open(url, '_system');
      }
    }
  }
}
