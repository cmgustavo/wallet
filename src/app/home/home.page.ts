import { Component, OnInit, inject } from '@angular/core';
import {IonicModule} from '@ionic/angular';
import {CommonModule} from '@angular/common';
import {Router} from "@angular/router";
import {WalletService} from "../services/wallet/wallet.service";
import {ConfigService} from "../services/config/config.service";
import {AddressesComponent} from "../components/addresses/addresses.component";
import {TransactionsComponent} from "../components/transactions/transactions.component";
import {DisclaimerComponent} from "../components/disclaimer/disclaimer.component";
import {RateResponse, RateService} from "../services/rates/rates.service";

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    imports: [IonicModule, CommonModule, AddressesComponent, TransactionsComponent, DisclaimerComponent]
})
export class HomePage implements OnInit {
  walletService = inject(WalletService);
  private router = inject(Router);
  private configService = inject(ConfigService);
  private rateService = inject(RateService);

  public isModalDisclaimerOpen: boolean = false;
  public showProgress: boolean = false;
  public isBalanceHidden: boolean = false;
  public fiatRate: RateResponse = undefined;

  constructor() {
    this.configService.checkDisclaimer().then((value) => {
      if (!value) {
        this.isModalDisclaimerOpen = true;
      }
    });
    this.configService.checkBalanceHidden().then((value) => {
      this.isBalanceHidden = value === 'true' ? true : false;
    });
  }

  async ngOnInit() {
    await this.walletService.loadSaved();
    this.configService.balance$.subscribe((value) => {
      this.isBalanceHidden = value === 'true' ? true : false;
    });
    this.rateService.currentFiatRate$.subscribe((value) => {
      this.fiatRate = value;
    });
  }

  getFiatRate(satoshi: number) {
    return this.rateService.fiatCurrencyStr(satoshi);
  }

  handleRefresh(event: any) {
    setTimeout(async () => {
      await this.rateService.refreshExchangeRates();
      await this.walletService.updateTotalBalance();
      await this.walletService.updateTransactions();
      await this.walletService.loadSaved();
      event.target.complete();
    }, 2000);
  }

  createWallet() {
    this.router.navigate(['/create']);
  }

  importWallet() {
    this.router.navigate(['/import']);
  }

  closeDisclaimer() {
    this.isModalDisclaimerOpen = false;
    this.configService.acceptDisclaimer('true');
  }
}
