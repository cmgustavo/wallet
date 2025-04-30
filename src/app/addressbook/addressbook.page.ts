import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {AddressBook, AddressbookService} from "../services/addressbook/addressbook.service";
import {Clipboard} from '@capacitor/clipboard';
import {CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHintALLOption} from "@capacitor/barcode-scanner";
import {ToastService} from "../services/toast/toast.service";

@Component({
  selector: 'app-addressbook',
  templateUrl: './addressbook.page.html',
  styleUrls: ['./addressbook.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddressbookPage implements OnInit {
  public name: string = '';
  public address: string = '';

  public isModalAddContact: boolean = false;
  public isDevice = this.platform.is('capacitor');

  public contacts: AddressBook = {};

  constructor(
    private toastService: ToastService,
    public walletService: WalletService,
    public platform: Platform,
    public addressbookService: AddressbookService,
  ) {}

  async copyAddress(address: string) {
    if (this.isDevice) {
      await Clipboard.write({string: address});
    } else {
      await navigator.clipboard.writeText(address);
    }
    console.log('Copied address: ', address);
    await this.toastService.presentToast('Address copied to clipboard');
  }

 openModalAddContact() {
    this.isModalAddContact = true;
 }

 closeModal() {
    this.isModalAddContact = false;
 }

  async ngOnInit() {
    this.addressbookService.getAddressBook().then(addressBook => {
      this.contacts = addressBook || {};
    });
  }

  async addContact() {
    if (!this.name) {
      await this.toastService.presentToast('Name is required');
      return;
    }
    if (!this.address) {
      await this.toastService.presentToast('Address is required');
      return;
    }
    if (!this.walletService.checkValidBitcoinAddress(this.address)) {
      await this.toastService.presentToast('Invalid address');
      return;
    }
    console.log('Adding contact', this.name, this.address);
    await this.addressbookService.addAddressBookEntry(this.address, this.name);
    await this.toastService.presentToast('Contact added');
    this.contacts = await this.addressbookService.getAddressBook() || {};
    this.closeModal();
  }

  async scanQRCode() {
    if (this.isDevice) {
      const result = await CapacitorBarcodeScanner.scanBarcode(
        {hint: CapacitorBarcodeScannerTypeHintALLOption.ALL}
      );
      if (result.ScanResult) {
        console.log('Scanned QR code', result.ScanResult);
        this.address = result.ScanResult;
      }
    }
  }

  async removeContact(address: string) {
    await this.addressbookService.removeAddressBookEntry(address);
    await this.toastService.presentToast('Contact removed');
  }

  async clearAddressBook() {
    await this.addressbookService.clearAddressBook();
    await this.toastService.presentToast('Address book cleared');
    this.contacts = {};
  }

  protected readonly Object = Object;
}
