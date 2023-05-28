import {Component, Input} from '@angular/core';
import {Transaction} from "../../services/wallet/wallet.service";
import {IonicModule} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-transactions-component',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf
  ]
})
export class TransactionsComponent {
  @Input() transactions: Transaction[] | undefined;

  constructor() {
  }
}
