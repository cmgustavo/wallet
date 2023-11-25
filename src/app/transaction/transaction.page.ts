import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActionSheetController, IonicModule, ToastController} from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {TransactionsComponent} from "../components/transactions/transactions.component";

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TransactionsComponent]
})
export class TransactionPage implements OnInit {

  constructor(
    private toastCtrl: ToastController,
    public actionSheetController: ActionSheetController,
    public walletService: WalletService
  ) { }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

  public async openOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Options',
      buttons: [
        {
          text: 'Clear Transactions',
          role: 'destructive',
          icon: 'trash',
          handler: async () => {
            await this.walletService.clearTransactions();
            console.log('Transactions deleted');
            const toast = await this.toastCtrl.create({
              message: 'Transactions deleted successfully',
              duration: 2500,
              position: 'top'
            });
            await toast.present();
          },
        },
      ],
    });
    await actionSheet.present();
  }

}
