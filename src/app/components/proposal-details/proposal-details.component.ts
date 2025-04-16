import {Component, Input} from '@angular/core';
import {ProposeTransaction, WalletService} from "../../services/wallet/wallet.service";
import {IonicModule, Platform, ToastController} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {Toast} from "@capacitor/toast";
import {Browser} from "@capacitor/browser";
import {RateService} from "../../services/rates/rates.service";

@Component({
  selector: 'app-proposal-details-component',
  templateUrl: './proposal-details.component.html',
  styleUrls: ['./proposal-details.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf,
  ]
})
export class ProposalDetailsComponent {
  @Input() tx: ProposeTransaction | undefined;
  @Input() network: string | undefined;
  public showProgress: boolean = false;
  constructor(
    public platform: Platform,
    public walletService: WalletService,
    public toastController: ToastController,
    public rateService: RateService) {
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
    });
    await toast.present();
  }

  getFiatRate(btc: number | undefined, isSatoshi: boolean = false) {
    if (!btc) {
      return '';
    }
    const satoshi = isSatoshi ? btc : Math.round(btc * 1e8); // 1 BTC = 100,000,000 Satoshis
    return this.rateService.fiatCurrencyStr(satoshi);
  }

  public async openExplorer() {
    const isTestnet = this.network === 'testnet';
    const url = `https://blockstream.info/${isTestnet ? 'testnet/' : ''}tx/${this.tx?.id}`;
    if (this.tx) {
      if (this.platform.is('capacitor')) {
        await Browser.open({url});
      } else {
        window.open(url, '_system');
      }
    }
  }

  public async remove() {
    this.showProgress = true;
    if (this.tx) {
      console.log('Removing proposal', this.tx.id);
      this.walletService.removeProposal(this.tx.id).then((response) => {
        console.log('Proposal removed', JSON.stringify(response));
        this.showProgress = false;
        this.presentToast('Proposal removed successfully');
      }).catch((error) => {
        this.showProgress = false;
        console.error('Error removing proposal', error);
      });
    }
  }

  public async broadcastProposal(tx: string | undefined) {
    this.showProgress = true;
    if (!tx) {
      return;
    }
    console.log('Broadcasting proposal', tx);
    this.walletService.broadcastTx(tx).then((response) => {
      console.log('Proposal broadcasted', JSON.stringify(response));
      this.showProgress = false;
      this.presentToast('Proposal broadcasted successfully');
      if (this.tx) {
        this.walletService.moveProposalToTransactions(this.tx.id);
      }
    }).catch((error) => {
      this.showProgress = false;
      console.error('Error broadcasting proposal', error);
    });
  }
}
