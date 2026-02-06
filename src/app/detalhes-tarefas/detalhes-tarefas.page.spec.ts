import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalhesTarefasPage } from './detalhes-tarefas.page';

describe('DetalhesTarefasPage', () => {
  let component: DetalhesTarefasPage;
  let fixture: ComponentFixture<DetalhesTarefasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalhesTarefasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
