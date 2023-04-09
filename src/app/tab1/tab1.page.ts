import { Component } from '@angular/core';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { ScanService, AddressFormat } from '../services/scan/scan.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, ExploreContainerComponent, CommonModule],
})
export class Tab1Page {
  constructor(
    public scanService: ScanService,
    public actionSheetController: ActionSheetController
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
}
