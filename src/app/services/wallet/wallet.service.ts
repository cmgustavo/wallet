import {Injectable, isDevMode} from '@angular/core';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import {Preferences} from "@capacitor/preferences";
import {IS_TESTNET, API_ENDPOINT} from "../../constants";
import {CapacitorHttp, HttpResponse} from '@capacitor/core';

export type Network = 'testnet' | 'livenet';
type TransactionType = 'sent' | 'received' | 'moved';
type ScriptType = 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'unknown';

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
  notes?: string;
  date: string;
  block_time: number;
  confirmed?: boolean;
  fee: number;
  feeStr?: string;
  type: TransactionType;
}

export interface ProposeTransaction {
  id: string;
  to: string;
  amount: number;
  fee: number;
  message: string;
  feeStr: string;
  amountStr: string;
  date: string;
  rawTx: string;
}

export interface Wallet {
  mnemonic: string | undefined;
  name: string | undefined;
  network: Network;
  balance: number | undefined;
  balanceStr?: string;
  addresses: Address[] | undefined;
  transactions: Transaction[] | undefined;
  proposals?: ProposeTransaction[];
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  public wallet: Wallet | undefined;
  private WALLET_STORAGE: string = 'wallet';
  private bip32 = BIP32Factory(ecc);

  constructor() {
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

  private btcToSatoshis = (btc: number): number => {
    return Math.round(btc * 1e8); // 1 BTC = 100,000,000 Satoshis
  };

  private satoshisToBtc = (satoshis: number): number => {
    return satoshis / 1e8; // 100,000,000 Satoshis = 1 BTC
  };

  private getAddress = (publicKey: any, isTestnet: boolean): string | undefined => {
    return bitcoin.payments.p2wpkh({
      pubkey: publicKey,
      network: isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    }).address;
  }

  public createWallet = async (name: string): Promise<{
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
    const derivePath = this.getDerivationPath(0, 0, IS_TESTNET);

    // Get the first external receive address from the HD wallet
    const addressNode = root.derivePath(derivePath);
    const publicKey = addressNode.publicKey;

    const address = this.getAddress(publicKey, IS_TESTNET);

    if (!address) throw new Error('Could not generate address');

    // Save the mnemonic and address to storage
    this.wallet = {
      mnemonic,
      name,
      balance: 0,
      balanceStr: '0 BTC',
      network: IS_TESTNET ? 'testnet' : 'livenet',
      addresses: [{
        address: address,
        balance: 0,
        index: 0,
        change: 0
      }],
      transactions: [],
      proposals: []
    };
    await this.saveWallet();

    // Return the mnemonic and address as an object
    return {
      mnemonic: mnemonic,
      address: address
    };
  }

  public importWallet = async (mnemonic: string, name: string): Promise<{
    address: string | undefined
  }> => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }
    const root = this.bip32.fromSeed(await bip39.mnemonicToSeedSync(mnemonic));
    const publicKey = root.derivePath(this.getDerivationPath(0, 0, IS_TESTNET)).publicKey;

    const address = this.getAddress(publicKey, IS_TESTNET);

    if (!address) throw new Error('Could not generate address');

    // Save the mnemonic and address to storage
    this.wallet = {
      mnemonic,
      name,
      balance: 0,
      balanceStr: '0 BTC',
      network: IS_TESTNET ? 'testnet' : 'livenet',
      addresses: [{
        address: address,
        balance: 0,
        index: 0,
        change: 0
      }],
      transactions: [],
      proposals: []
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

  private saveProposal = async (id: string, to: string, amount: number, amountStr: string, fee: number, feeStr: string, message: string, date: string, rawTx: string) => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    if (!this.wallet.proposals) {
      this.wallet.proposals = [];
    }
    this.wallet.proposals.push({
      id,
      to,
      amount,
      fee,
      message,
      date,
      rawTx,
      feeStr,
      amountStr
    });
    await this.saveWallet();
  };

  public moveProposalToTransactions = async (id: string) => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    if (!this.wallet.proposals) throw new Error('Proposals not initialized');
    if (!this.wallet.transactions) throw new Error('Transactions not initialized');
    const proposal = this.wallet.proposals.find((proposal) => {
      return proposal.id === id;
    });
    if (!proposal) throw new Error('Proposal not found');
    const tx: Transaction = {
      id: proposal.id,
      amount: proposal.amount,
      amountStr: proposal.amountStr,
      notes: proposal.message,
      date: proposal.date,
      block_time: new Date().getTime(),
      confirmed: false,
      fee: proposal.fee,
      feeStr: proposal.feeStr,
      type: 'sent',
    };
    this.wallet.transactions.push(tx);
    await this.removeProposal(id);
  }

  private getDerivationPath = (index: number = 0, change: number = 0, isTestnet: boolean = false) => {
    // m / purpose' / coin_type' / account' / change / address_index
    return `m/84'/${isTestnet ? 0 : 1}'/0'/${change}/${index}`;
  }

  private getTransactionsByAddress = async (address: string): Promise<Transaction[]> => {
    const url = `${API_ENDPOINT}/address/${address}/txs`;
    const response = await fetch(url);
    const transactions = await response.json();
    return transactions;
  }

  private getTransaction = async (txid: string, address: string): Promise<Transaction | undefined> => {
    const url = `${API_ENDPOINT}/tx/${txid}`;
    const response = await fetch(url);
    const transaction = await response.json();

    // Check if the address is in the inputs or outputs
    const inputs = transaction.vin.map((input: any) => input.prevout.scriptpubkey_address);
    const outputs = transaction.vout.map((output: any) => output.scriptpubkey_address);

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
      amountStr: this.satoshisToBtc(amount) + ' BTC',
      notes: '',
      date: typeof date === 'object' && date ? date.toLocaleString() : new Date().toLocaleString(),
      block_time: transaction.status.block_time,
      confirmed: transaction.status.confirmed,
      fee: transaction.fee,
      feeStr: this.satoshisToBtc(transaction.fee) + ' BTC',
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

  public getProposals = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    return this.wallet.proposals || [];
  }

  public clearProposals = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    this.wallet.proposals = [];
    await this.saveWallet();
  }

  public removeProposal = async (id: string) => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    if (!this.wallet.proposals) throw new Error('Proposals not initialized');
    this.wallet.proposals = this.wallet.proposals.filter((proposal) => {
      return proposal.id !== id;
    });
    await this.saveWallet();
  }

  public getLastAddress = () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    const noChangeAddresses = addresses.filter((address) => {
      return address.change !== 1;
    });
    return noChangeAddresses[noChangeAddresses.length - 1];
  }

  private getNewChangeAddress = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;

    if (!addresses) throw new Error('Addresses no generated');
    // Filter by change addresses
    const changeAddresses = addresses.filter((address) => {
      return address.change === 1;
    });

    const address = await this.createAddress(changeAddresses.length, 1);
    addresses.push({
      address: address,
      balance: 0,
      index: changeAddresses.length,
      change: 1
    });
    await this.saveWallet();
    return address;
  }

  public getNewAddress = async () => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    // Filter by no change addresses
    const noChangeAddresses = addresses.filter((address) => {
      return address.change !== 1;
    });
    const address = await this.createAddress(noChangeAddresses.length, 0);
    addresses.push({
      address: address,
      balance: 0,
      index: noChangeAddresses.length,
      change: 0
    });
    await this.saveWallet();
    return address;
  }

  private getAddressBalance = async (address: string): Promise<number> => {
    const url = `${API_ENDPOINT}/address/${address}/utxo`;
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
      address.balance = await this.getAddressBalance(address.address);
    });
    await Promise.all(promises);
    this.wallet.balance = this.calculateTotalBalance();
    this.wallet.balanceStr = this.satoshisToBtc(this.wallet.balance) + ' BTC';
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
    const root = this.bip32.fromSeed(bip39.mnemonicToSeedSync(this.wallet.mnemonic));
    const isTestnet = this.wallet.network === 'testnet';
    const derivePath = this.getDerivationPath(index, change, isTestnet);
    const addressNode = root.derivePath(derivePath);
    const publicKey = addressNode.publicKey;
    const address = this.getAddress(publicKey, isTestnet);
    if (!address) throw new Error('Could not generate address');
    return address;
  }

  private currentFeeRate = async (): Promise<number> => {
    const url = `${API_ENDPOINT}/fee-estimates`;
    const response = await fetch(url);
    const feeRates = await response.json();
    const feeRate = feeRates['2'];
    return feeRate;
  }

  private getUtxosByAddress = async (address: string): Promise<any[]> => {
    const url = `${API_ENDPOINT}/address/${address}/utxo`;
    const response = await fetch(url);
    const utxos = await response.json();
    return utxos;
  }

  private getUTXOs = async (): Promise<any[]> => {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const addresses = this.wallet.addresses;
    if (!addresses) throw new Error('Addresses no generated');
    const network = IS_TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
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

  public broadcastTx = async (txHex: string) => {
    const url = `${API_ENDPOINT}/tx`;
    const options = {
      url,
      headers: { 'Content-Type': 'text/plain' },
      data: txHex,
    };
    try {
      const response: HttpResponse = await CapacitorHttp.post(options);
      console.log('Transaction ID:', response.data);
      return response;
    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      throw new Error('Error broadcasting transaction');
    }
  }

  isDust(amountSat: number, scriptType: ScriptType): boolean {
    const minRelayTxFee = 1000; // Default min relay fee (satoshis/kB)
    let outputSize = 34; // Default for P2PKH

    if (scriptType === 'p2pkh') outputSize = 34; // Pay-to-PubKey-Hash
    else if (scriptType === 'p2sh') outputSize = 32; // Pay-to-Script-Hash
    else if (scriptType === 'p2wpkh') outputSize = 31; // Native SegWit (P2WPKH)
    else if (scriptType === 'p2wsh') outputSize = 43; // SegWit P2WSH

    const dustThreshold = (outputSize * minRelayTxFee) / 1000;

    console.log(`Dust Threshold for ${scriptType}:`, dustThreshold, 'satoshis');
    return amountSat < dustThreshold;
  }

  detectScriptType(scriptPubKey: string): ScriptType {
    if (scriptPubKey.startsWith('76a914') && scriptPubKey.endsWith('88ac')) {
      return 'p2pkh';
    } else if (scriptPubKey.startsWith('a914') && scriptPubKey.endsWith('87')) {
      return 'p2sh';
    } else if (scriptPubKey.startsWith('0014')) {
      return 'p2wpkh';
    } else if (scriptPubKey.startsWith('0020')) {
      return 'p2wsh';
    }
    return 'unknown';
  }

  // Create a transaction with MAX amount available
  public sendMax = async (to: string, message: string): Promise<any> => {
    if (!to || !this.wallet || !this.wallet.mnemonic) throw new Error('Wallet not initialized');
    const filteredUtxos = await this.getUTXOs();

    const utxos = filteredUtxos.flatMap((utxo: any) => utxo.utxos);
    const balanceSat = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const feeRate = await this.currentFeeRate();
    const estimatedSize = utxos.length * 148 + 2 * 34 + 10; // Approximate size
    const feeSat = Math.round(estimatedSize * feeRate);
    const changeValue = balanceSat - feeSat;
    if (changeValue < 0) throw new Error('Insufficient funds for fee');
    if (balanceSat < feeSat) throw new Error('Insufficient funds including fee');

    const isTestnet = this.wallet.network === 'testnet';
    const psbt = new bitcoin.Psbt({network: isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin});
    const root = this.bip32.fromSeed(await bip39.mnemonicToSeedSync(this.wallet.mnemonic));

    const utxoScriptTypes: { [key: string]: ScriptType } = {};
    filteredUtxos.forEach((input: any) => {
      let scriptType: ScriptType = this.detectScriptType(input.scriptpubkey);
      input.utxos.forEach((utxo: any) => {
        utxoScriptTypes[utxo.txid] = scriptType;
        if (this.isDust(utxo.value, scriptType)) {
          throw new Error('Amount is too low and considered dust');
        }
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(input.scriptpubkey, 'hex'),
            value: utxo.value,
          },
        });
      });
    });

    try {
      psbt.addOutput({
        address: to,
        value: balanceSat - feeSat,
      });
    } catch (e) {
      console.log('Error adding output', JSON.stringify(e));
      throw new Error('Adding output');
    }

    utxos.forEach((utxo: any, index: number) => {
      console.log('UTXO', utxo, index);
      try {
        const scriptType = utxoScriptTypes[utxo.txid];
        console.log('Script Type:', scriptType);
        const derivationPath = this.getDerivationPath(utxo.index, 0, isTestnet);
        console.log('Derivation Path:', derivationPath);
        const keyPair = root.derivePath(derivationPath);
        console.log('Derived public key:', keyPair.publicKey.toString('hex'));
        const derivedPubKey = keyPair.publicKey.toString('hex');
        console.log(`Expected: ${utxo.pubkey}, Derived: ${derivedPubKey}`);
        psbt.signInput(index, keyPair);
      } catch (e) {
        console.log('Error signing input', e);
        throw new Error('Signing input');
      }

    });

    try {
      psbt.finalizeAllInputs();
    } catch (error) {
      console.error('PSBT Finalization Error:', error);
      throw new Error('Finalizing inputs');
    }

    try {
      const tx = psbt.extractTransaction();
      await this.saveProposal(
        tx.getId(),
        to,
        this.satoshisToBtc(balanceSat - feeSat),
        `${this.satoshisToBtc(balanceSat - feeSat)} BTC`,
        feeSat,
        `${this.satoshisToBtc(feeSat)} BTC`,
        message,
        new Date().toLocaleString(),
        tx.toHex()
      );
      return {
        tx: tx.toHex(),
        fee: feeSat / 1e8,
      }
    } catch (error) {
      throw new Error('Error extracting transaction');
    }
  }

  public createTx = async (to: string, amount: number, message: string): Promise<any> => {
    if (!to || !this.wallet || !this.wallet.mnemonic) throw new Error('Wallet not initialized');
    const filteredUtxos = await this.getUTXOs();

    const utxos = filteredUtxos.flatMap((utxo: any) => utxo.utxos);
    const amountSat = this.btcToSatoshis(amount);
    console.log('Amount:', amount, 'BTC');
    console.log('Amount:', amountSat, 'Satoshis');
    const balanceSat = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

    const feeRate = await this.currentFeeRate();
    const estimatedSize = utxos.length * 148 + 2 * 34 + 10; // Approximate size
    const feeSat = Math.round(estimatedSize * feeRate);
    console.log('Estimated size:', estimatedSize);
    console.log('Fee Rate:', feeRate, 'satoshis per byte');
    console.log('Estimated Fee:', feeSat, 'satoshis');

    const changeValue = balanceSat - amountSat - feeSat;
    if (changeValue < 0) throw new Error('Insufficient funds for fee');

    if (balanceSat < amountSat + feeSat) throw new Error('Insufficient funds including fee');

    console.log('Transaction Fee:', this.satoshisToBtc(feeSat), 'BTC');
    const isTestnet = this.wallet.network === 'testnet';
    const psbt = new bitcoin.Psbt({network: isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin});
    const root = this.bip32.fromSeed(await bip39.mnemonicToSeedSync(this.wallet.mnemonic));

    const utxoScriptTypes: { [key: string]: ScriptType } = {};
    filteredUtxos.forEach((input: any) => {
      let scriptType: ScriptType = this.detectScriptType(input.scriptpubkey);
      input.utxos.forEach((utxo: any) => {
        utxoScriptTypes[utxo.txid] = scriptType;
        if (this.isDust(utxo.value, scriptType)) {
          throw new Error('Amount is too low and considered dust');
        }
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(input.scriptpubkey, 'hex'),
            value: utxo.value,
          },
        });
      });
    });

    try {
      psbt.addOutput({
        address: to,
        value: amountSat,
      });
      if (changeValue > 546) { // Prevent dust output
        psbt.addOutput({ address: await this.getNewChangeAddress(), value: changeValue });
      } else {
        console.log('Change is dust, adding to fee:', changeValue);
      }
    } catch (e) {
      console.log('Error adding output', JSON.stringify(e));
      throw new Error('Adding output');
    }

    utxos.forEach((utxo: any, index: number) => {
      console.log('UTXO', utxo, index);
      try {
        const scriptType = utxoScriptTypes[utxo.txid];
        console.log('Script Type:', scriptType);
        const derivationPath = this.getDerivationPath(utxo.index, 0, isTestnet);
        console.log('Derivation Path:', derivationPath);
        const keyPair = root.derivePath(derivationPath);
        console.log('Derived public key:', keyPair.publicKey.toString('hex'));
        const derivedPubKey = keyPair.publicKey.toString('hex');
        console.log(`Expected: ${utxo.pubkey}, Derived: ${derivedPubKey}`);
        psbt.signInput(index, keyPair);
      } catch (e) {
        console.log('Error signing input', e);
        throw new Error('Signing input');
      }
    });

    try {
      psbt.finalizeAllInputs();
    } catch (error) {
      console.error('PSBT Finalization Error:', error);
      throw new Error('Finalizing inputs');
    }

    try {
      const tx = psbt.extractTransaction();
      await this.saveProposal(
        tx.getId(),
        to,
        amount,
        `${amount} BTC`,
        feeSat,
        `${this.satoshisToBtc(feeSat)} BTC`,
        message,
        new Date().toLocaleString(),
        tx.toHex()
      );
      return {
        tx: tx.toHex(),
        fee: feeSat / 1e8,
      }
    } catch (error) {
      throw new Error('Error extracting transaction');
    }
  }

  checkValidBitcoinAddress(address: string): boolean {
    try {
      if (IS_TESTNET) {
        bitcoin.address.toOutputScript(address, bitcoin.networks.testnet);
      } else {
        bitcoin.address.toOutputScript(address);
      }
      return true;
    } catch (error) {
      console.error('Invalid Bitcoin address:', error);
      return false;
    }
  }
}
