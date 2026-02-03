import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjetosPage } from './projetos.page';

describe('ProjetosPage', () => {
  let component: ProjetosPage;
  let fixture: ComponentFixture<ProjetosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjetosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
