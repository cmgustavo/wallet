import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {Router} from '@angular/router';
import {WalletService} from "../services/wallet/wallet.service";
import {BackupComponent} from "../components/backup/backup.component";
import {PinService} from "../services/pin/pin.service";
import {ToastService} from "../services/toast/toast.service";

@Component({
    selector: 'app-backup',
    templateUrl: './backup.page.html',
    styleUrls: ['./backup.page.scss'],
    imports: [IonicModule, CommonModule, FormsModule, BackupComponent]
})
export class BackupPage implements OnInit {
  walletService = inject(WalletService);
  private router = inject(Router);
  private pinService = inject(PinService);
  private toastService = inject(ToastService);

  // First-time backup right after creating a new wallet: the mnemonic is
  // passed via navigation state and only exists in memory until finalized.
  public firstTime = false;
  public firstTimeMnemonic = '';
  private newWalletName = 'Bitcoin Wallet';
  public showProgress = false;

  // Verification quiz shown before we let the user delete the phrase.
  public verifying = false;
  public verifyIndices: number[] = [];
  public verifyInputs: {[index: number]: string} = {};

  async ngOnInit() {
    const state = history.state;
    if (state?.firstTime && state?.mnemonic) {
      this.firstTime = true;
      this.firstTimeMnemonic = state.mnemonic;
      this.newWalletName = state.name || 'Bitcoin Wallet';
      return;
    }
    await this.walletService.loadSaved();
  }

  private get words(): string[] {
    return this.firstTimeMnemonic.trim().split(/\s+/);
  }

  // Pick 3 distinct word positions at random for the verification quiz.
  private pickVerifyIndices(): number[] {
    const all = Array.from({length: this.words.length}, (_, i) => i);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, 3).sort((a, b) => a - b);
  }

  // Step 1 of deletion: make sure the user actually wrote the words down.
  startVerification() {
    this.verifyIndices = this.pickVerifyIndices();
    this.verifyInputs = {};
    this.verifying = true;
  }

  cancelVerification() {
    this.verifying = false;
  }

  // Step 2: check the entered words, then set a PIN and finalize.
  async verifyWords() {
    const ok = this.verifyIndices.every(
      i => (this.verifyInputs[i] || '').trim().toLowerCase() === this.words[i],
    );
    if (!ok) {
      await this.toastService.presentToast(
        'Those words do not match. Check your backup and try again.',
      );
      return;
    }
    await this.finalizeWithPin();
  }

  private async finalizeWithPin() {
    const pin = await this.pinService.setPin();
    if (!pin) return;
    this.showProgress = true;
    try {
      await this.walletService.finalizeCreate(
        this.firstTimeMnemonic,
        this.newWalletName,
        pin,
      );
      // Drop the phrase from memory now that it is safely (encrypted) persisted.
      this.firstTimeMnemonic = '';
      this.firstTime = false;
      this.verifying = false;
      this.showProgress = false;
      await this.toastService.presentToast('Wallet created successfully');
      await this.router.navigate(['/tabs/home']);
    } catch (e) {
      console.log('Could not finalize wallet', e);
      this.showProgress = false;
      await this.toastService.presentToast('Could not finalize wallet');
    }
  }

  // Legacy wallets: encrypt the key with a PIN and remove the stored phrase.
  async migrateWallet() {
    const pin = await this.pinService.setPin();
    if (!pin) return;
    this.showProgress = true;
    try {
      await this.walletService.migrateLegacyWallet(pin);
      this.showProgress = false;
      await this.toastService.presentToast(
        'Recovery phrase removed from this device',
      );
    } catch (e) {
      console.log('Could not secure wallet', e);
      this.showProgress = false;
      await this.toastService.presentToast('Could not secure wallet');
    }
  }
}
