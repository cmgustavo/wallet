import { Component, Input, inject } from '@angular/core';
import {Transaction} from "../../services/wallet/wallet.service";
import {IonicModule, Platform} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {Browser} from "@capacitor/browser";
import {RateService} from "../../services/rates/rates.service";

@Component({
    selector: 'app-transaction-details-component',
    templateUrl: './transaction-details.component.html',
    styleUrls: ['./transaction-details.component.scss'],
    imports: [
        IonicModule,
        NgForOf,
        NgIf,
    ]
})
export class TransactionDetailsComponent {
  platform = inject(Platform);
  rateService = inject(RateService);

  public isDevice = this.platform.is('capacitor');
  @Input() tx: Transaction | undefined;
  @Input() network: string | undefined;

  getFiatRate(satoshi: number | undefined) {
    if (!satoshi) {
      return '';
    }
    return this.rateService.fiatCurrencyStr(satoshi);
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
