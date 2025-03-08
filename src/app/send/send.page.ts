import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActionSheetController, IonicModule, IonProgressBar, AlertController, ToastController} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";

@Component({
  selector: 'app-send',
  templateUrl: './send.page.html',
  styleUrls: ['./send.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class SendPage implements OnInit {
  public showProgress: boolean = false;
  public to: string;
  public amount: number;
  public message: string;

  constructor(
    public walletService: WalletService,
    public actionSheetController: ActionSheetController,
    public alertController: AlertController,
    public toastController: ToastController) {
    this.to = '';
    this.amount = 0;
    this.message = '';
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

  async presentAlert(error: string) {
    const alert = await this.alertController.create({
      header: 'There was an error',
      message: error,
      buttons: ['Ok'],
    });

    await alert.present();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
    });
    await toast.present();
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
            this.showProgress = true;
            await actionSheet.dismiss();
            // TODO: this.walletService.send(this.to, this.amount, this.message);
            try {
              const {tx, fee} = await this.walletService.createTx(this.to, this.amount, this.message) || {};
              if (!tx) {
                throw new Error('Could not create transaction');
              }
              await this.walletService.broadcastTx(tx);
              this.showProgress = false;
              await this.presentToast('Transaction sent');
            } catch (e) {
              console.error('#### error', e);
              this.showProgress = false;
              const errStr = typeof e === 'string' ? e : JSON.stringify(e);
              await this.presentAlert(errStr);
            }

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
