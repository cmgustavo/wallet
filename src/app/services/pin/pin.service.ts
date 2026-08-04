import {Injectable, inject} from '@angular/core';
import {AlertController} from '@ionic/angular';
import {ToastService} from '../toast/toast.service';

// Prompts for a 6-digit PIN used to encrypt/decrypt the wallet's private key.
// The PIN is never stored; it only lives long enough to derive the AES key.
@Injectable({
  providedIn: 'root',
})
export class PinService {
  private alertController = inject(AlertController);
  private toastService = inject(ToastService);

  private isValidPin = (pin: string): boolean => /^\d{6}$/.test(pin);

  // Ask the user to choose and confirm a new PIN. Resolves with the PIN, or
  // null if the user cancels.
  public setPin = async (): Promise<string | null> => {
    return new Promise<string | null>(resolve => {
      this.alertController
        .create({
          header: 'Create a 6-digit PIN',
          subHeader:
            'You will need it to send bitcoin. It cannot be recovered if you forget it.',
          backdropDismiss: false,
          inputs: [
            {
              name: 'pin',
              type: 'password',
              attributes: {inputmode: 'numeric', maxlength: 6},
              placeholder: 'PIN',
            },
            {
              name: 'confirm',
              type: 'password',
              attributes: {inputmode: 'numeric', maxlength: 6},
              placeholder: 'Confirm PIN',
            },
          ],
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => resolve(null),
            },
            {
              text: 'Set PIN',
              handler: data => {
                if (!this.isValidPin(data.pin)) {
                  this.toastService.presentToast('PIN must be 6 digits');
                  return false; // keep the alert open
                }
                if (data.pin !== data.confirm) {
                  this.toastService.presentToast('PINs do not match');
                  return false;
                }
                resolve(data.pin);
                return true;
              },
            },
          ],
        })
        .then(alert => alert.present());
    });
  };

  // Ask the user to enter their existing PIN (e.g. before signing). Resolves
  // with the PIN, or null if the user cancels.
  public enterPin = async (
    header: string = 'Enter your PIN',
  ): Promise<string | null> => {
    return new Promise<string | null>(resolve => {
      this.alertController
        .create({
          header,
          backdropDismiss: false,
          inputs: [
            {
              name: 'pin',
              type: 'password',
              attributes: {inputmode: 'numeric', maxlength: 6},
              placeholder: 'PIN',
            },
          ],
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => resolve(null),
            },
            {
              text: 'Ok',
              handler: data => {
                if (!this.isValidPin(data.pin)) {
                  this.toastService.presentToast('PIN must be 6 digits');
                  return false;
                }
                resolve(data.pin);
                return true;
              },
            },
          ],
        })
        .then(alert => alert.present());
    });
  };
}
