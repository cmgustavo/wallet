import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressbookPage } from './addressbook.page';

describe('AddressbookPage', () => {
  let component: AddressbookPage;
  let fixture: ComponentFixture<AddressbookPage>;

  beforeEach((() => {
    fixture = TestBed.createComponent(AddressbookPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
