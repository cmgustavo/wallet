import {Component, Input} from '@angular/core';
import {Transaction} from "../../services/wallet/wallet.service";
import {IonicModule} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-transaction-details-component',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf,
  ]
})
export class TransactionDetailsComponent {
  @Input() tx: Transaction | undefined;
  constructor() {}
}
