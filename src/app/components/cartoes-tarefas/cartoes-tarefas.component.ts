import { Component, OnInit, Input} from '@angular/core';

export interface Tarefa {
  id: number;
  titulo: string;
  projeto: string;
  descricao: string;
  dataLimite: string;
  estado: 'por-fazer' | 'feito' | 'atrasada';
  tipo?: 'hoje' | 'atrasadas'; 
}

@Component({
  selector: 'app-cartoes-tarefas',
  templateUrl: './cartoes-tarefas.component.html',
  styleUrls: ['./cartoes-tarefas.component.scss'],
  standalone: false,
})
export class CartoesTarefasComponent  implements OnInit {
  @Input() tarefa!: Tarefa;


  constructor() { }

  ngOnInit() {}

}
