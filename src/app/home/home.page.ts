import { Component } from '@angular/core';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { ScanService, AddressFormat } from '../services/scan/scan.service';
import { CommonModule } from '@angular/common';
import {navigate} from "ionicons/icons";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, ExploreContainerComponent, CommonModule],
})
export class HomePage {
  constructor(
    public scanService: ScanService,
    public actionSheetController: ActionSheetController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.scanService.loadSaved();
  }

  scanAddress() {
    this.scanService.scanAddress();
  }

  public async showActionSheet(address: AddressFormat, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.scanService.deleteAddress(address, position);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            // Nothing to do, action sheet is automatically closed
          },
        },
      ],
    });
    await actionSheet.present();
  }

  createWallet() {
    this.router.navigate(['/create']);
  }
}
