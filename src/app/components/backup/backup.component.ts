import { Component, Input, inject } from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {WalletService} from "../../services/wallet/wallet.service";

@Component({
    selector: 'app-backup-component',
    templateUrl: './backup.component.html',
    styleUrls: ['./backup.component.scss'],
    imports: [
        IonicModule
    ]
})
export class BackupComponent {
  walletService = inject(WalletService);

  @Input() mnemonic: string | undefined;
}
