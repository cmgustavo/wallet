import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform, ToastController} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {Router} from "@angular/router";
import {AddressBook, AddressbookService} from "../services/addressbook/addressbook.service";
import { Clipboard } from '@capacitor/clipboard';
import {CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHintALLOption} from "@capacitor/barcode-scanner";

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
    private router: Router,
    private toastCtrl: ToastController,
    public walletService: WalletService,
    public platform: Platform,
    public addressbookService: AddressbookService,
  ) {}

  async copyAddress(address: string) {
    await Clipboard.write({
      string: address
    });
    await this.presentToast('Address copied to clipboard');
  }

 openModalAddContact() {
    this.isModalAddContact = true;
 }

 closeModal() {
    this.isModalAddContact = false;
 }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
    });
    await toast.present();
  }

  async ngOnInit() {
    this.addressbookService.getAddressBook().then(addressBook => {
      this.contacts = addressBook || {};
    });
  }

  async addContact() {
    if (!this.name) {
      await this.presentToast('Name is required');
      return;
    }
    if (!this.address) {
      await this.presentToast('Address is required');
      return;
    }
    if (!this.walletService.checkValidBitcoinAddress(this.address)) {
      await this.presentToast('Invalid address');
      return;
    }
    console.log('Adding contact', this.name, this.address);
    await this.addressbookService.addAddressBookEntry(this.address, this.name);
    await this.presentToast('Contact added');
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
    await this.presentToast('Contact removed');
  }

  async clearAddressBook() {
    await this.addressbookService.clearAddressBook();
    await this.presentToast('Address book cleared');
    this.contacts = {};
  }

  protected readonly Object = Object;
}
