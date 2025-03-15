import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActionSheetController, AlertController, IonicModule, Platform, ToastController, IonToggle} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHintALLOption} from "@capacitor/barcode-scanner";

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
  public useTotalAmount: boolean = false;

  private isDevice = this.platform.is('capacitor');

  constructor(
    public platform: Platform,
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

  async useTotalAmountChanged(event: CustomEvent) {
    this.useTotalAmount = event.detail.checked;
  }

  async scanQRCode() {
    if (this.isDevice) {
      const result = await CapacitorBarcodeScanner.scanBarcode(
        {hint: CapacitorBarcodeScannerTypeHintALLOption.ALL}
      );
      if (result.ScanResult) {
        console.log('Scanned QR code', result.ScanResult);
        this.to = result.ScanResult;
      }
    }
  }

  private clearForm() {
    this.to = '';
    this.amount = 0;
    this.message = '';
  }

  async presentAlert(error: string) {
    const alert = await this.alertController.create({
      header: 'Could not create transaction',
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

  public async sendMax() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Send maximum amount',
      buttons: [
        {
          text: 'Send Max',
          role: 'selected',
          icon: 'send',
          handler: async () => {
            this.showProgress = true;
            await actionSheet.dismiss();
            this.walletService.sendMax(this.to, this.message).then(async (tx) => {
              console.log('Transaction Proposal created', tx);
              this.showProgress = false;
              this.clearForm();
              await this.presentToast('Transaction Proposal created');
            } ).catch(async (e) => {
              console.log('Transaction Proposal creation error', e);
              this.showProgress = false;
              this.clearForm();
              await this.presentAlert(e.toString());
            } );
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

  public async createTransaction() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Confirm you are creating transaction of ' + this.amount + 'BTC to ' + this.to,
      buttons: [
        {
          text: 'Confirm and Create',
          role: 'selected',
          icon: 'send',
          handler: async () => {
            this.showProgress = true;
            await actionSheet.dismiss();
            // TODO: this.walletService.send(this.to, this.amount, this.message);
            try {
              const tx = await this.walletService.createTx(this.to, this.amount, this.message) || {};
              console.log('Transaction Proposal created', tx);
              this.showProgress = false;
              this.clearForm();
              await this.presentToast('Transaction Proposal created');
            } catch (e: any) {
              console.log('Transaction Proposal creation error', e);
              this.showProgress = false;
              this.clearForm();
              await this.presentAlert(e.toString());
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
