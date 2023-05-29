import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActionSheetController, IonicModule} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";

@Component({
  selector: 'app-send',
  templateUrl: './send.page.html',
  styleUrls: ['./send.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class SendPage implements OnInit {
  public to: string | undefined;
  public amount: number | undefined;
  public message: string | undefined;
  constructor(public walletService: WalletService, public actionSheetController: ActionSheetController,) {
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

  public async send() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Confirm you are sending ' + this.amount + 'BTC to ' + this.to,
      buttons: [
        {
          text: 'Confirm and Send',
          role: 'selected',
          icon: 'send',
          handler: async () => {
            // TODO: this.walletService.send(this.to, this.amount, this.message);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            // Nothing to do, action sheet is automatically closed
          },
        },
      ],
    });
    await actionSheet.present();
  }
}
