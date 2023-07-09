import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackupPage } from './backup.page';

describe('BackupPage', () => {
  let component: BackupPage;
  let fixture: ComponentFixture<BackupPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(BackupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
