import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule, Platform, ToastController} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {Router} from "@angular/router";
import {ProposalDetailsComponent} from "../components/proposal-details/proposal-details.component";
import {AddressBookObject, AddressbookService} from "../services/addressbook/addressbook.service";

@Component({
  selector: 'app-addressbook',
  templateUrl: './addressbook.page.html',
  styleUrls: ['./addressbook.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ProposalDetailsComponent]
})
export class AddressbookPage implements OnInit {
  public name: string = '';
  public address: string = '';
  public isModalAddContact: boolean = false;
  public isDevice = this.platform.is('capacitor');
  public contacts: AddressBookObject[] = [];

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    public walletService: WalletService,
    public platform: Platform,
    public addressbookService: AddressbookService,
  ) {
    this.addressbookService.getAddressBook().then(addressBook => {
      this.contacts = addressBook;
    });
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
  }

  addContact() {
    if (!this.name) {
      this.presentToast('Name is required');
      return;
    }
    if (!this.address) {
      this.presentToast('Address is required');
      return;
    }
    if (!this.walletService.checkValidBitcoinAddress(this.address)) {
      this.presentToast('Invalid address');
      return;
    }
    console.log('Adding contact', this.name, this.address);
    this.addressbookService.addAddressBookEntry(this.name, this.address);
    this.closeModal();
  }

  removeContact(address: string) {
    this.addressbookService.removeAddressBookEntry(address);
  }
}
