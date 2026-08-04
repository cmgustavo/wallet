import {Injectable} from '@angular/core';

// Ciphertext bundle produced by encrypt(). All fields are base64-encoded so the
// payload can be stored as plain JSON in Capacitor Preferences.
export interface EncryptedPayload {
  salt: string;
  iv: string;
  ct: string;
}

// AES-256-GCM encryption with a key derived from a user PIN via PBKDF2.
// Used to protect the account xprv on the device: the PIN is never stored,
// so the private key can only be recovered by entering the correct PIN.
@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  // High iteration count to slow down brute-forcing a short numeric PIN.
  private ITERATIONS = 200000;

  private toB64 = (buf: ArrayBuffer): string => {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  };

  private fromB64 = (b64: string): Uint8Array => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  };

  private deriveKey = async (
    pin: string,
    salt: Uint8Array,
  ): Promise<CryptoKey> => {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(pin),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
      {name: 'PBKDF2', salt, iterations: this.ITERATIONS, hash: 'SHA-256'},
      keyMaterial,
      {name: 'AES-GCM', length: 256},
      false,
      ['encrypt', 'decrypt'],
    );
  };

  public encrypt = async (
    plaintext: string,
    pin: string,
  ): Promise<EncryptedPayload> => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(pin, salt);
    const ct = await crypto.subtle.encrypt(
      {name: 'AES-GCM', iv},
      key,
      new TextEncoder().encode(plaintext),
    );
    return {
      salt: this.toB64(salt.buffer),
      iv: this.toB64(iv.buffer),
      ct: this.toB64(ct),
    };
  };

  // Throws (AES-GCM authentication failure) if the PIN is wrong or the
  // payload was tampered with. Callers should treat any error as "wrong PIN".
  public decrypt = async (
    payload: EncryptedPayload,
    pin: string,
  ): Promise<string> => {
    const salt = this.fromB64(payload.salt);
    const iv = this.fromB64(payload.iv);
    const ct = this.fromB64(payload.ct);
    const key = await this.deriveKey(pin, salt);
    const plainBuf = await crypto.subtle.decrypt(
      {name: 'AES-GCM', iv},
      key,
      ct,
    );
    return new TextDecoder().decode(plainBuf);
  };
}
