import {Component, OnInit} from '@angular/core';
import {IonicModule} from '@ionic/angular';
import {CommonModule} from '@angular/common';
import {Router} from "@angular/router";
import {WalletService} from "../services/wallet/wallet.service";
import {AddressesComponent} from "../components/addresses/addresses.component";
import {TransactionsComponent} from "../components/transactions/transactions.component";
import {DisclaimerComponent} from "../components/disclaimer/disclaimer.component";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, AddressesComponent, TransactionsComponent, DisclaimerComponent],
})
export class HomePage implements OnInit {
  public showProgress: boolean = false;
  constructor(
    public walletService: WalletService,
    private router: Router
  ) {
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
    if (this.walletService.wallet) {
      await this.walletService.updateTotalBalance();
      await this.walletService.updateTransactions();
    }
  }

  handleRefresh(event: any) {
    setTimeout(async () => {
      await this.walletService.updateTotalBalance();
      await this.walletService.updateTransactions();
      event.target.complete();
    }, 2000);
  }

  createWallet() {
    this.router.navigate(['/create']);
  }

  importWallet() {
    this.router.navigate(['/import']);
  }
}
