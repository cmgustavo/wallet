import {Component, Input} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {Address, WalletService} from "../../services/wallet/wallet.service";

@Component({
  selector: 'app-addresses-component',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf
  ]
})
export class AddressesComponent {
  @Input() addresses: Address[] | undefined;

  constructor(public walletService: WalletService) {
  }
}
