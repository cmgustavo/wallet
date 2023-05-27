import { Component } from '@angular/core';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CommonModule } from '@angular/common';
import {Router} from "@angular/router";
import {Wallet, WalletService} from "../services/wallet/wallet.service";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, ExploreContainerComponent, CommonModule],
})
export class HomePage {
  constructor(
    public actionSheetController: ActionSheetController,
    public walletService: WalletService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

  public async showActionSheet(position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Wallet',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.walletService.deleteWallet(position);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            // Nothing to do, action sheet is automatically closed
          },
        },
      ],
    });
    await actionSheet.present();
  }

  createWallet() {
    this.router.navigate(['/create']);
  }
}
