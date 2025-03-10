import {Component, Input} from '@angular/core';
import {ProposeTransaction, WalletService} from "../../services/wallet/wallet.service";
import {IonicModule, Platform} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {Toast} from "@capacitor/toast";
import {Browser} from "@capacitor/browser";

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
  constructor(public platform: Platform, public walletService: WalletService) {
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

  public async broadcastProposal(tx: string | undefined) {
    this.showProgress = true;
    if (!tx) {
      return;
    }
    console.log('Broadcasting proposal', tx);
    this.walletService.broadcastTx(tx).then((response) => {
      console.log('Proposal broadcasted', JSON.stringify(response));
      this.showProgress = false;
      if (this.platform.is('capacitor')) {
        Toast.show({
          text: 'Proposal broadcasted successfully',
          duration: 'short'
        });
      }
    }).catch((error) => {
      this.showProgress = false;
      console.error('Error broadcasting proposal', error);
    });
  }
}
