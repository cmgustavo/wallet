import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActionSheetController, AlertController, IonicModule, Platform, ToastController, IonToggle} from '@ionic/angular';
import {ProposeTransaction, WalletService} from "../services/wallet/wallet.service";
import {AddressBook, AddressbookService} from "../services/addressbook/addressbook.service";
import {CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHintALLOption} from "@capacitor/barcode-scanner";
import {ProposalsComponent} from "../components/proposals/proposals.component";
import {ThemeService} from "../services/theme/theme.service";

@Component({
  selector: 'app-send',
  templateUrl: './send.page.html',
  styleUrls: ['./send.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ProposalsComponent],
})
export class SendPage implements OnInit {
  public showProgress: boolean = false;
  public to: string;
  public amount: number;
  public message: string;
  public useTotalAmount: boolean = false;
  public contacts: AddressBook = {};
  public proposals: ProposeTransaction[] = [];

  private isDevice = this.platform.is('capacitor');
  private isDark = this.themeService.isDark;

  constructor(
    public platform: Platform,
    public walletService: WalletService,
    public actionSheetController: ActionSheetController,
    public alertController: AlertController,
    public addressbookService: AddressbookService,
    public themeService: ThemeService,
    public toastController: ToastController) {
    this.to = '';
    this.amount = 0;
    this.message = '';
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
    // Check there is proposals
    this.proposals = await this.walletService.getProposals();
    this.addressbookService.getAddressBook().then(addressBook => {
      this.contacts = addressBook || {};
    });
  }

  async openModalContacts() {
    this.contacts = await this.addressbookService.getAddressBook() || {};
    const actionSheet = await this.actionSheetController.create({
      header: 'Contacts',
      cssClass: this.isDark ? 'dark-action-sheet' : '',
      buttons: Object.keys(this.contacts).map((address) => {
        return {
          text: this.contacts[address],
          icon: 'person',
          handler: () => {
            this.to = address;
          },
        };
      }).concat([
        {
          text: 'Cancel',
          icon: 'close',
          handler: () => {
            // Nothing to do, action sheet is automatically closed
          },
        },
      ]),
    });
    await actionSheet.present();
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
    this.useTotalAmount = false;
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
      cssClass: this.isDark ? 'dark-action-sheet' : '',
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
      cssClass: this.isDark ? 'dark-action-sheet' : '',
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
