import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {AddressesComponent} from "../components/addresses/addresses.component";

@Component({
  selector: 'app-address',
  templateUrl: './address.page.html',
  styleUrls: ['./address.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AddressesComponent]
})
export class AddressPage implements OnInit {

  constructor(
    public walletService: WalletService
  ) { }

  async ngOnInit() {
    await this.walletService.loadSaved();
  }

}
