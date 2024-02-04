import {Injectable, isDevMode} from '@angular/core';
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
  amountStr?: string;
  notes: string;
  date: string;
  block_time: number;
  confirmed: boolean;
  fee: number;
  feeStr?: string;
  type: TransactionType;
}

export interface Wallet {
  mnemonic: string | undefined;
  name: string | undefined;
  network: Network;
  balance: number | undefined;
  balanceStr?: string;
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
    console.log('WalletService constructor');
    if (isDevMode()) {
      console.log('Development mode');
    } else {
      console.log('Production mode');
    }
    if (this.wallet) {
      this.updateTotalBalance();
      this.updateTransactions();
    }
  }

  private getAddress = (publicKey: any, isTestnet: boolean): string | undefined => {
    return bitcoin.payments.p2wpkh({
      pubkey: publicKey,
      network: isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    }).address;
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

    const address = this.getAddress(publicKey, isTestnet);

    if (!address) throw new Error('Could not generate address');

    // Save the mnemonic and address to storage
    this.wallet = {
      mnemonic,
      name,
      balance: 0,
      balanceStr: '0 BTC',
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

    const address = this.getAddress(publicKey, isTestnet);

    if (!address) throw new Error('Could not generate address');

    // Save the mnemonic and address to storage
    this.wallet = {
      mnemonic,
      name,
      balance: 0,
      balanceStr: '0 BTC',
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
    // TODO: use wallet network
    // m / purpose' / coin_type' / account' / change / address_index
    return `m/84'/0'/0'/${change}/${index}`;
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

    // Check if the address is in the inputs or outputs
    const inputs = transaction.vin.map((input:any) => input.prevout.scriptpubkey_address);
    const outputs = transaction.vout.map((output:any) => output.scriptpubkey_address);

    const date = transaction.status.block_time ? new Date(transaction.status.block_time * 1000) : undefined;
    const amount = transaction.vout.reduce((previousValue: number, currentValue: any) => {
      if (!outputs.includes(address)) {
        return previousValue - currentValue.value;
      }
      return currentValue.scriptpubkey_address === address ? previousValue + currentValue.value : previousValue;
    }, 0);
    const tx: Transaction = {
      id: transaction.txid,
      amount,
      amountStr: amount / 1e8 + ' BTC',
      notes: '',
      date: typeof date === 'object' && date ? date.toLocaleString() : new Date().toLocaleString(),
      block_time: transaction.status.block_time,
      confirmed: transaction.status.confirmed,
      fee: transaction.fee,
      feeStr: transaction.fee / 1e8 + ' BTC',
      type: inputs.includes(address) ? 'sent' : outputs.includes(address) ? 'received' : 'moved',
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
        // Update existent transaction
        txs.forEach((t, index) => {
          if (tx && t.id === tx.id) {
            txs[index] = tx;
          }
        });
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

  private getNewChangeAddress = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    const address = await this.createAddress(addresses.length, 1);
    addresses.push({
      address: address,
      balance: 0,
      index: addresses.length,
      change: 1
    });
    await this.saveWallet();
    return address;
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
    this.wallet.balanceStr = this.wallet.balance / 1e8 + ' BTC';
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
    const isTestnet = this.wallet.network === 'testnet' ? true : false;
    const address = this.getAddress(publicKey, isTestnet);
    if (!address) throw new Error('Could not generate address');
    return address;
  }

  private currentFeeRate = async (): Promise<number> => {
    // TODO use wallet network
    const url = `https://blockstream.info/testnet/api/fee-estimates`;
    const response = await fetch(url);
    const feeRates = await response.json();
    const feeRate = feeRates['2'];
    return feeRate;
  }

  private getUtxosByAddress = async (address: string): Promise<any[]> => {
    // TODO use wallet network
    const url = `https://blockstream.info/testnet/api/address/${address}/utxo`;
    const response = await fetch(url);
    const utxos = await response.json();
    return utxos;
  }

  private getUTXOs = async (): Promise<any[]> => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    const network = bitcoin.networks.testnet;
    const promises = addresses.map(async (address) => {
      const utxos = await this.getUtxosByAddress(address.address);
      return {
        address: address.address,
        scriptpubkey: bitcoin.address.toOutputScript(address.address, network).toString('hex'),
        utxos: utxos
      };
    });
    const data = await Promise.all(promises);
    return data.filter((d: any) => {
      return d.utxos[0];
    });
  }

  public broadcastTx = async (tx: string) => {
    // TODO use wallet network
    const url = `https://blockstream.info/testnet/api/tx`;
    const response = await fetch(url, {
      method: 'POST',
      body: tx,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    return result;
  }

  public createTx = async (to: string, amount: number, message: string): Promise<any> => {
    if (!to || !this.wallet || !this.wallet.mnemonic) throw new Error('Wallet not initialized');
    const filteredUtxos = await this.getUTXOs();
    const utxos = filteredUtxos.map((utxo: any) => {
      return utxo.utxos;
    }).flat();
    const amountSat = Number(amount * 1e8);
    const balanceSat = utxos.reduce((previousValue: number, currentValue: any) => {
      return previousValue + currentValue.value;
    }, 0);
    if (balanceSat < amountSat) throw new Error('Insufficient funds');

    const feeRate = await this.currentFeeRate();
    console.log('#### feeRate', feeRate);

    // Calculate the fee
    const inputAmount = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const feeSat = inputAmount - amountSat;

    console.log('Transaction Fee:', feeSat / 1e8, 'BTC');

    const psbt = new bitcoin.Psbt({network: this.wallet.network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin});
    const root = this.bip32.fromSeed(await bip39.mnemonicToSeedSync(this.wallet.mnemonic));
    const keyPair = root.derivePath(this.getDerivationPath());
    if (!keyPair) throw new Error('Could not generate public key');

    filteredUtxos.forEach((input: any) => {
      input.utxos.forEach((utxo: any) => {
        try {
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              script: Buffer.from(input.scriptpubkey, 'hex'),
              value: utxo.value,
            },
          });
        } catch (e) {
          console.log('#### ERROR adding input', e);
          throw new Error('Error adding input');
        }

      });
    });
    psbt.addOutput({
      address: to,
      value: amountSat,
    });
    psbt.addOutput({
      address: await this.getNewChangeAddress(),
      value: balanceSat - amountSat,
    });
    utxos.forEach((utxo: any, index: number) => {
      try {
        psbt.signInput(index, keyPair);
      } catch (e) {
        console.log('#### ERROR signing input', e);
        throw new Error('Error signing input');
      }
    });
    try {
      psbt.finalizeAllInputs();
    } catch (error) {
      console.error('Error finalizing inputs:', error);
      throw new Error('Error finalizing inputs');
    }
    try {
      const tx = psbt.extractTransaction();
      return {
        tx: tx.toHex(),
        fee: feeSat / 1e8,
      }
    } catch (error) {
      console.error('#### Error extracting transaction:', error);
      throw new Error('Error extracting transaction');
    }
  }
}
