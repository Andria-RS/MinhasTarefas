import { TestBed } from '@angular/core/testing';

import { Opcoes } from './opcoes';

describe('Opcoes', () => {
  let service: Opcoes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Opcoes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
