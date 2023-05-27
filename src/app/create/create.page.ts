import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {WalletService} from "../services/wallet/wallet.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-create',
  templateUrl: './create.page.html',
  styleUrls: ['./create.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CreatePage implements OnInit {
  public name: string = '';
  public selectedNetwork: string = 'livenet';

  constructor(
    private router: Router,
    public walletService: WalletService
  ) { }

  async ngOnInit() {}

  submitRequest() {
    // Here, you can write the logic to submit the request
    console.log(`Name: ${this.name}`);
    console.log(`Network: ${this.selectedNetwork}`);

    const isTestnet = this.selectedNetwork === 'testnet';
    // Create wallet
    this.walletService.createWallet(undefined, isTestnet, this.name).then((wallet) => {
      console.log('Wallet created', wallet);
    });


    this.router.navigate(['/tabs/home']).then(r => console.log(r))
  }

}
