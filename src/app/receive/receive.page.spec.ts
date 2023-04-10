import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceivePage } from './receive.page';

describe('ReceivePage', () => {
  let component: ReceivePage;
  let fixture: ComponentFixture<ReceivePage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReceivePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
