import { Injectable } from '@angular/core';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private bip32 = BIP32Factory(ecc);

  constructor() { }

  public createWallet  = async (derivePath: string = "m/44'/0'/0'", isTestnet: boolean = true): Promise<{ mnemonic: string, address: string | undefined }> => {
    // Generate a new BIP39 mnemonic
    const mnemonic: string = bip39.generateMnemonic();

    // Derive a BIP32 seed from the mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Use the seed to create a BIP32 HD wallet
    const root = this.bip32.fromSeed(seed);

    // Get the first external receive address from the HD wallet
    const addressNode = root.derivePath(derivePath + "/0/0");
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

    // Return the mnemonic and address as an object
    return {
      mnemonic: mnemonic,
      address: address
    };
  }
}
