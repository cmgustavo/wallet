import {Injectable} from '@angular/core';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import {Preferences} from "@capacitor/preferences";

export type Network = 'testnet' | 'livenet';
type TransactionType = 'sent' | 'received' | 'moved';

export interface Balance {
  total: number;
  confirmed: number;
  unconfirmed: number;
  coin: string;
}
export interface Address {
  address: string;
  balance: number;
  index: number;
  change: number;
}

export interface Transaction {
  id: string;
  amount: number;
  notes: string;
  date: string;
  block_time: number;
  confirmed: boolean;
  fee: number;
  type: TransactionType;
}

export interface Wallet {
  mnemonic: string | undefined;
  name: string | undefined;
  network: Network;
  balance: number | undefined;
  addresses: Address[] | undefined;
  transactions: Transaction[] | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  public wallet: Wallet | undefined;
  private WALLET_STORAGE: string = 'wallet';
  private bip32 = BIP32Factory(ecc);

  constructor() {
  }

  public createWallet = async (isTestnet: boolean = false, name: string): Promise<{
    mnemonic: string,
    address: string | undefined
  }> => {
    // Generate a new BIP39 mnemonic
    const mnemonic: string = bip39.generateMnemonic();

    // Derive a BIP32 seed from the mnemonic
    const seed = await bip39.mnemonicToSeedSync(mnemonic);

    // Use the seed to create a BIP32 HD wallet
    const root = this.bip32.fromSeed(seed);

    // Get the derivation path to use for the external wallet addresses
    const derivePath = this.getDerivationPath();

    // Get the first external receive address from the HD wallet
    const addressNode = root.derivePath(derivePath);
    const publicKey = addressNode.publicKey;

    /*
    const { address } = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        pubkey: publicKey,
        network: bitcoin.networks.testnet,
      }),
      network: bitcoin.networks.testnet,
    }); */

    const {address} = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network: isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    });

    if (!address) throw new Error('Could not generate address');

    // Save the mnemonic and address to storage
    this.wallet = {
      mnemonic,
      name,
      balance: 0,
      network: isTestnet ? 'testnet' : 'livenet',
      addresses: [{
        address: address,
        balance: 0,
        index: 0,
        change: 0
      }],
      transactions: []
    };
    await this.saveWallet();

    // Return the mnemonic and address as an object
    return {
      mnemonic: mnemonic,
      address: address
    };
  }

  public importWallet = async (mnemonic: string, isTestnet: boolean = false, name: string): Promise<{
    address: string | undefined
  }> => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }
    const root = this.bip32.fromSeed(await bip39.mnemonicToSeedSync(mnemonic));
    const publicKey = root.derivePath(this.getDerivationPath()).publicKey;

    const {address} = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network: isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    });

    if (!address) throw new Error('Could not generate address');

    // Save the mnemonic and address to storage
    this.wallet = {
      mnemonic,
      name,
      balance: 0,
      network: isTestnet ? 'testnet' : 'livenet',
      addresses: [{
        address: address,
        balance: 0,
        index: 0,
        change: 0
      }],
      transactions: []
    };
    await this.saveWallet();

    // Return the mnemonic and address as an object
    return {
      address: address
    };
  }

  private saveWallet = async () => {
    const value = JSON.stringify(this.wallet);
    await Preferences.set({
      key: this.WALLET_STORAGE,
      value: value,
    });
  };
  public loadSaved = async () => {
    const {value} = await Preferences.get({key: this.WALLET_STORAGE});
    if (value) {
      this.wallet = JSON.parse(value) as Wallet;
    }
  };

  public deleteWallet = async () => {
    delete this.wallet;
    await Preferences.remove({
      key: this.WALLET_STORAGE,
    });
  }

  private getDerivationPath = (index: number = 0, change: number = 0) => {
    return `m/44'/${change}'/${index}'`;
  }

  private getTransactionsByAddress = async (address: string): Promise<Transaction[]> => {
    // TODO use wallet network
    const url = `https://blockstream.info/testnet/api/address/${address}/txs`;
    const response = await fetch(url);
    const transactions = await response.json();
    return transactions;
  }

  private getTransaction = async (txid: string, address: string): Promise<Transaction | undefined> => {
    // TODO use wallet network
    const url = `https://blockstream.info/testnet/api/tx/${txid}`;
    const response = await fetch(url);
    const transaction = await response.json();
    const type = transaction.vout.find((input: any) => {
      return input.scriptpubkey_address === address;
    });
    const date = new Date(transaction.status.block_time * 1000);
    const tx: Transaction = {
      id: transaction.txid,
      amount: transaction.vout.reduce((previousValue: number, currentValue: any) => {
        return currentValue.scriptpubkey_address === address ? previousValue + currentValue.value : previousValue;
      }, 0),
      notes: '',
      date: typeof date === 'object' && date !== null ? date.toLocaleString() : new Date().toLocaleString(),
      block_time: transaction.status.block_time,
      confirmed: transaction.status.confirmed,
      fee: transaction.fee,
      type: type ? 'received' : 'sent',
    };
    return tx;
  }

  public updateTransactions = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    const txs: Transaction[] = this.wallet.transactions || [];
    const promises = addresses.map(async (address) => {
      const transactions = await this.getTransactionsByAddress(address.address);
      const promises = transactions.map(async (transaction: any) => {
        const tx = await this.getTransaction(transaction.txid, address.address);
        // Only insert if not exists in wallet transactions array
        if (tx && !txs.find((t) => t.id === tx.id)) {
          txs.push(tx);
        }
      });
      await Promise.all(promises);
    });
    await Promise.all(promises);
    // Order by more recent transaction
    this.wallet.transactions = txs.sort((a, b) => {
      return b.block_time - a.block_time;
    });
    await this.saveWallet();
  }

  public clearTransactions = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    this.wallet.transactions = [];
    await this.saveWallet();
  }

  public getLastAddress = () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    return addresses[addresses.length - 1];
  }

  public getNewAddress = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    const address = await this.createAddress(addresses.length, 0);
    addresses.push({
      address: address,
      balance: 0,
      index: addresses.length,
      change: 0
    });
    await this.saveWallet();
    return address;
  }

  private getAddressBalance = async (address: string): Promise<number> => {
    // TODO use wallet network
    const url = `https://blockstream.info/testnet/api/address/${address}/utxo`;
    const response = await fetch(url);
    const utxos = await response.json();
    const balance = utxos.reduce((previousValue: number, currentValue: any) => {
      return previousValue + currentValue.value;
    }, 0);
    return balance;
  }

  public updateTotalBalance = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    const promises = addresses.map(async (address) => {
      const balance = await this.getAddressBalance(address.address);
      address.balance = balance;
    });
    await Promise.all(promises);
    this.wallet.balance = this.calculateTotalBalance();
    await this.saveWallet();
  }

  private calculateTotalBalance = (): number => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    return addresses.reduce((previousValue: number, currentValue: Address) => {
      return previousValue + currentValue.balance;
    }, 0);
  }

  private createAddress = async (index: number, change: number) => {
    if (!this.wallet || !this.wallet.mnemonic) throw new Error('Wallet not initialized');
    const root = this.bip32.fromSeed(await bip39.mnemonicToSeedSync(this.wallet.mnemonic));
    const derivePath = this.getDerivationPath(index, change);
    const addressNode = root.derivePath(derivePath);
    const publicKey = addressNode.publicKey;
    const {address} = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network: this.wallet.network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    });
    if (!address) throw new Error('Could not generate address');
    return address;
  }
}
