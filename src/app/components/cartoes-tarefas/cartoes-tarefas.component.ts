import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface Tarefa {
  id: number;
  titulo: string;
  projeto: string;
  descricao: string;
  dataLimite: string;
  estado: 'por-fazer' | 'feito' | 'atrasada';
  tipo?: 'hoje' | 'proximas' | 'atrasadas';
}

@Component({
  selector: 'app-cartoes-tarefas',
  templateUrl: './cartoes-tarefas.component.html',
  styleUrls: ['./cartoes-tarefas.component.scss'],
  standalone: false,
})
export class CartoesTarefasComponent {

  @Input() tarefa!: Tarefa;

  @Output() abrirDetalhes = new EventEmitter<Tarefa>();
  @Output() abrirOpcoesProjetos = new EventEmitter<Tarefa>(); // se já tinhas para os 3 pontinhos

  onClickCard() {
    this.abrirDetalhes.emit(this.tarefa);
  }

  onClickOpcoes(event: Event) {
    event.stopPropagation();
    this.abrirOpcoesProjetos.emit(this.tarefa);
  }
}
