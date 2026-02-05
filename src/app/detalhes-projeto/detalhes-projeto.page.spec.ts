import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalhesProjetoPage } from './detalhes-projeto.page';

describe('DetalhesProjetoPage', () => {
  let component: DetalhesProjetoPage;
  let fixture: ComponentFixture<DetalhesProjetoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalhesProjetoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
