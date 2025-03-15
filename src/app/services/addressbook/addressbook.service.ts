import { Injectable } from '@angular/core';
import {Preferences} from "@capacitor/preferences";

export interface AddressBook {
  [address: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddressbookService {
  private ADDRESSBOOK_STORAGE: string = 'addressbook';

  constructor() {}

  async getAddressBook(): Promise<AddressBook | undefined> {
    const {value} = await Preferences.get({key: this.ADDRESSBOOK_STORAGE});
    return value ? JSON.parse(value) as AddressBook : undefined;
  }

  async saveAddressBook(addressBook: AddressBook): Promise<void> {
    const value = JSON.stringify(addressBook);
    await Preferences.set({key: this.ADDRESSBOOK_STORAGE, value: value});
  }

  async addAddressBookEntry(address: string, name: string): Promise<void> {
    const addressBook = await this.getAddressBook() || {};
    addressBook[address] = name;
    await this.saveAddressBook(addressBook);
  }

  async removeAddressBookEntry(address: string): Promise<void> {
    const addressBook = await this.getAddressBook() || {};
    delete addressBook[address];
    await this.saveAddressBook(addressBook);
  }

  async clearAddressBook(): Promise<void> {
    await Preferences.remove({key: this.ADDRESSBOOK_STORAGE});
  }
}
