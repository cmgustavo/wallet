import {Component, Input} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {NgForOf, NgIf} from "@angular/common";
import {WalletService} from "../../services/wallet/wallet.service";

@Component({
  selector: 'app-backup-component',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgForOf,
    NgIf
  ]
})
export class BackupComponent {
  @Input() mnemonic: string | undefined;

  constructor(public walletService: WalletService) {
  }
}
