import {Component, Input} from '@angular/core';
import {ProposeTransaction} from "../../services/wallet/wallet.service";
import {IonicModule} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {ProposalDetailsComponent} from "../proposal-details/proposal-details.component";

@Component({
  selector: 'app-proposals-component',
  templateUrl: './proposals.component.html',
  styleUrls: ['./proposals.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf,
    ProposalDetailsComponent,
  ]
})
export class ProposalsComponent {
  @Input() proposals: ProposeTransaction[] | undefined;
  @Input() network: string | undefined;


  public isModalTransactionDetailsOpen: boolean = false;
  public currentProposal: ProposeTransaction | undefined;

  constructor() {
  }

  closeTransactionDetails() {
    this.isModalTransactionDetailsOpen = false;
  }

  openTransactionDetails(tx: ProposeTransaction) {
    this.currentProposal = tx;
    this.isModalTransactionDetailsOpen = true;
  }
}
