import { TestBed } from '@angular/core/testing';

import { AddressbookService } from './addressbook.service';

describe('AddressbookService', () => {
  let service: AddressbookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddressbookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
