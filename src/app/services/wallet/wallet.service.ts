import {Injectable} from '@angular/core';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import {Preferences} from "@capacitor/preferences";

type Network = 'testnet' | 'livenet';
type TransactionType = 'sent' | 'received' | 'moved';

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
  date: Date;
  confirmations: number;
  fee: number;
  type: TransactionType;
}

export interface Wallet {
  mnemonic: string | undefined;
  name: string | undefined;
  network: Network;
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
      network: isTestnet ? 'testnet' : 'livenet',
      addresses: [{
        address: address,
        balance: 0,
        index: 0,
        change: 0
      }],
      transactions: []
    };
    this.saveWallet();

    // Return the mnemonic and address as an object
    return {
      mnemonic: mnemonic,
      address: address
    };
  }

  private saveWallet = () => {
    const value = JSON.stringify(this.wallet);
    Preferences.set({
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
    Preferences.remove({
      key: this.WALLET_STORAGE,
    });
  }

  private getDerivationPath = (index: number = 0, change: number = 0) => {
    return `m/44'/${change}'/${index}'`;
  }
}
