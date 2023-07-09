import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {BackupComponent} from "../components/backup/backup.component";

@Component({
  selector: 'app-backup',
  templateUrl: './backup.page.html',
  styleUrls: ['./backup.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, BackupComponent]
})
export class BackupPage implements OnInit {

  constructor(
    public walletService: WalletService
  ) { }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

}
