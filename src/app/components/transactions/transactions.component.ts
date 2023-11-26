import {Component, Input} from '@angular/core';
import {Transaction} from "../../services/wallet/wallet.service";
import {IonicModule} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {TransactionDetailsComponent} from "../transaction-details/transaction-details.component";

@Component({
  selector: 'app-transactions-component',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf,
    TransactionDetailsComponent
  ]
})
export class TransactionsComponent {
  @Input() transactions: Transaction[] | undefined;
  @Input() network: string | undefined;

  public isModalTransactionDetailsOpen: boolean = false;
  public currentTx: Transaction | undefined;

  constructor() {
  }

  closeTransactionDetails() {
    this.isModalTransactionDetailsOpen = false;
  }

  openTransactionDetails(tx: Transaction) {
    this.currentTx = tx;
    this.isModalTransactionDetailsOpen = true;
  }
}
