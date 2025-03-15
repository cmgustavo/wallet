import { Injectable } from '@angular/core';
import {Preferences} from "@capacitor/preferences";

export interface AddressBook {
  [address: string]: string;
}

export interface AddressBookObject {
  address: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddressbookService {
  private ADDRESSBOOK_STORAGE: string = 'addressbook';
  public addressBook: AddressBook = {};

  constructor() {
    this.loadAddressBook();
  }

  async loadAddressBook(): Promise<any> {
    const {value} = await Preferences.get({key: this.ADDRESSBOOK_STORAGE});
    if (value) {
      this.addressBook = JSON.parse(value) as AddressBook;
    }
  }

  async getAddressBook(): Promise<AddressBookObject[]> {
    await this.loadAddressBook();
    return Object.entries(this.addressBook).map(([address, name]) => ({address, name}));
  }

  async saveAddressBook(): Promise<void> {
    const value = JSON.stringify(this.addressBook);
    await Preferences.set({key: this.ADDRESSBOOK_STORAGE, value: value});
  }

  async addAddressBookEntry(address: string, name: string): Promise<void> {
    this.addressBook[address] = name;
    await this.saveAddressBook();
  }

  async removeAddressBookEntry(address: string): Promise<void> {
    delete this.addressBook[address];
    await this.saveAddressBook();
  }

  async clearAddressBook(): Promise<void> {
    await Preferences.remove({key: this.ADDRESSBOOK_STORAGE});
  }
}
