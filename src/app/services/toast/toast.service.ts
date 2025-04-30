import { Injectable } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular';
import { Toast } from '@capacitor/toast';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public isDevice = this.platform.is('capacitor');

  constructor(
    private platform: Platform,
    private toastCtrl: ToastController
  ) {}

  async presentToast(message: string) {
    if (this.isDevice) {
      await Toast.show({
        text: message,
        duration: 'short'
      });
    } else {
      const toast = await this.toastCtrl.create({
        message: message,
        duration: 2500,
        position: 'middle'
      });
      await toast.present();
    }
  }
}
