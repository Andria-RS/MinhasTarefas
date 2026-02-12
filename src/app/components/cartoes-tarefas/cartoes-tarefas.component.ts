import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * Interface que representa uma tarefa para exibição nos cartões.
 * Contém informações formatadas e prontas para apresentação na UI.
 */
export interface Tarefa {
  /** Identificador único da tarefa. */
  id: number;
  
  /** Título da tarefa. */
  titulo: string;
  
  /** Nome do projeto ao qual a tarefa pertence. */
  projeto: string;
  
  /** Descrição da tarefa. */
  descricao: string;
  
  /** Data e hora limite formatada para exibição (ex: "12/02/2026, 14:30"). */
  dataLimite: string;
  
  /** Estado atual da tarefa. */
  estado: 'por-fazer' | 'feito' | 'atrasada';
  
  /** Tipo/categoria da tarefa para filtros (opcional). */
  tipo?: 'hoje' | 'proximas' | 'concluidas' | 'atrasadas';
}

/**
 * Componente reutilizável para exibir cartões de tarefas.
 * Apresenta informações resumidas da tarefa (título, projeto, data, estado).
 * Emite eventos quando o utilizador clica no cartão ou no botão de opções.
 * É usado em várias páginas: home, calendário, detalhes de projeto, etc.
 */
@Component({
  selector: 'app-cartoes-tarefas',
  templateUrl: './cartoes-tarefas.component.html',
  styleUrls: ['./cartoes-tarefas.component.scss'],
  standalone: false,
})
export class CartoesTarefasComponent {

  /** Tarefa a ser exibida no cartão (recebida do componente pai). */
  @Input() tarefa!: Tarefa;

  /** Evento emitido quando o utilizador clica no cartão para ver detalhes. */
  @Output() abrirDetalhes = new EventEmitter<Tarefa>();
  
  /** Evento emitido quando o utilizador clica no botão de opções (três pontos). */
  @Output() abrirOpcoesProjetos = new EventEmitter<Tarefa>(); 

  /**
   * Callback chamado quando o utilizador clica no cartão.
   * Emite evento para o componente pai abrir a página de detalhes da tarefa.
   */
  onClickCard() {
    this.abrirDetalhes.emit(this.tarefa);
  }

  /**
   * Callback chamado quando o utilizador clica no botão de opções (três pontos).
   * Para a propagação do evento para evitar que o clique também dispare onClickCard.
   * Emite evento para o componente pai abrir menu de opções.
   * 
   * @param event - Evento de clique do DOM.
   */
  onClickOpcoes(event: Event) {
    event.stopPropagation();
    this.abrirOpcoesProjetos.emit(this.tarefa);
  }
}
