import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  ActionSheetController,
  AlertController,
  IonicModule,
  Platform,
} from '@ionic/angular';
import {
  ProposeTransactionObj,
  WalletService,
  TxRecipient,
} from '../services/wallet/wallet.service';
import {
  AddressBook,
  AddressbookService,
} from '../services/addressbook/addressbook.service';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHintALLOption,
} from '@capacitor/barcode-scanner';
import {ThemeService} from '../services/theme/theme.service';
import {RateResponse, RateService} from '../services/rates/rates.service';
import {wallet} from 'ionicons/icons';
import {ToastService} from '../services/toast/toast.service';

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
  public useTotalAmount: boolean = true;
  public contacts: AddressBook = {};
  public proposal: ProposeTransactionObj;
  public fiatRate: RateResponse = undefined;
  public recipients: TxRecipient[] = []; // Initialize with one empty recipient

  private isDevice = this.platform.is('capacitor');
  private isDark = this.themeService.isDark;

  constructor(
    public platform: Platform,
    public walletService: WalletService,
    public actionSheetController: ActionSheetController,
    public alertController: AlertController,
    public addressbookService: AddressbookService,
    public themeService: ThemeService,
    private toastService: ToastService,
    public rateService: RateService,
  ) {
    this.to = '';
    this.amount = 0;
    this.message = '';
  }

  handleRefresh(event: any) {
    setTimeout(async () => {
      await this.walletService.loadSaved();
      if (this.walletService.wallet) {
        this.proposal = await this.walletService.getProposals();
      }
      this.addressbookService.getAddressBook().then(addressBook => {
        this.contacts = addressBook || {};
      });
      event.target.complete();
    }, 2000);
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
    if (this.walletService.wallet) {
      this.proposal = await this.walletService.getProposals();
    }
    this.addressbookService.getAddressBook().then(addressBook => {
      this.contacts = addressBook || {};
    });
    this.rateService.currentFiatRate$.subscribe(value => {
      this.fiatRate = value;
    });
  }

  getFiatRate(satoshi: number | undefined) {
    if (!satoshi) {
      return '';
    }
    return this.rateService.fiatCurrencyStr(satoshi);
  }

  getFiatRateBtc(btc: number | undefined) {
    if (!btc) {
      return '';
    }
    const satoshi = Math.round(btc * 1e8); // 1 BTC = 100,000,000 Satoshis
    return this.rateService.fiatCurrencyStr(satoshi);
  }

  async openModalContacts() {
    this.contacts = (await this.addressbookService.getAddressBook()) || {};
    const contactsButton = Object.keys(this.contacts).map(address => {
      return {
        text: this.contacts[address],
        icon: 'person',
        handler: () => {
          this.to = address;
        },
      };
    });
    if (contactsButton.length === 0) {
      contactsButton.push({
        text: 'No contacts available',
        icon: 'alert-outline',
        handler: () => {
          // Do nothing
        },
      });
    }
    const actionSheet = await this.actionSheetController.create({
      header: 'Contacts',
      cssClass: this.isDark ? 'dark-action-sheet' : '',
      buttons: [
        ...contactsButton,
        {
          text: 'Close',
          role: 'cancel',
          data: {
            action: 'cancel',
          },
        },
      ],
    });
    await actionSheet.present();
  }

  async scanQRCode() {
    if (this.isDevice) {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
      });
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
    this.recipients = [];
    this.useTotalAmount = true;
  }

  async presentAlert(error: string) {
    const alert = await this.alertController.create({
      header: 'Could not create transaction',
      message: error,
      buttons: ['Ok'],
    });

    await alert.present();
  }

  public async sendMax() {
    this.amount = 0;
    this.recipients = [];
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
            this.walletService
              .sendMax(this.to, this.message)
              .then(async tx => {
                console.log('Transaction Proposal created', tx);
                this.showProgress = false;
                this.clearForm();
                this.proposal = await this.walletService.getProposals();
                await this.toastService.presentToast(
                  'Transaction Proposal created',
                );
              })
              .catch(async e => {
                console.log('Transaction Proposal creation error', e);
                this.showProgress = false;
                this.clearForm();
                await this.presentAlert(e.toString());
              });
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

  public addRecipient() {
    this.recipients.push({address: this.to, amount: this.amount});
    this.to = '';
    this.amount = 0;
  }

  public removeRecipient(index: number) {
    this.recipients.splice(index, 1);
  }

  public async createTransaction() {
    const totalAmount = this.recipients
      .reduce((sum, recipient) => sum + recipient.amount, 0)
      .toFixed(8);
    const header =
      this.recipients.length > 1
        ? 'Confirm you are creating transaction of ' +
          totalAmount +
          'BTC to multiple recipients'
        : 'Confirm you are creating transaction of ' +
          this.recipients[0].amount +
          ' BTC';
    const actionSheet = await this.actionSheetController.create({
      header: header,
      cssClass: this.isDark ? 'dark-action-sheet' : '',
      buttons: [
        {
          text: 'Confirm and Create',
          role: 'selected',
          icon: 'send',
          handler: async () => {
            this.showProgress = true;
            await actionSheet.dismiss();
            try {
              const tx =
                (await this.walletService.createTx(
                  this.recipients,
                  this.message,
                )) || {};
              console.log('Transaction Proposal created', tx);
              this.showProgress = false;
              this.clearForm();
              this.proposal = await this.walletService.getProposals();
              await this.toastService.presentToast(
                'Transaction Proposal created',
              );
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

  public async remove() {
    this.showProgress = true;
    if (this.proposal) {
      console.log('Removing proposal', this.proposal.id);
      this.walletService
        .removeProposal(this.proposal.id)
        .then(response => {
          console.log('Proposal removed', JSON.stringify(response));
          this.showProgress = false;
          this.proposal = undefined;
          this.toastService.presentToast('Proposal removed successfully');
        })
        .catch(error => {
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
    this.walletService
      .broadcastTx(tx)
      .then(response => {
        console.log('Proposal broadcasted', JSON.stringify(response));
        this.showProgress = false;
        this.proposal = undefined;
        this.walletService.clearProposals();
        this.toastService.presentToast('Proposal broadcasted successfully');
      })
      .catch(error => {
        this.showProgress = false;
        console.error('Error broadcasting proposal', error);
      });
  }

  protected readonly wallet = wallet;
}
