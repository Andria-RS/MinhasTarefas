import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';

type FiltroTarefas = 'hoje' | 'atrasadas';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  filtro: FiltroTarefas = 'hoje'; 
  isModalAberto = false;

  tarefas: Tarefa[] = [
  {
    id: 1,
    titulo: 'Estudar PMEU',
    projeto: 'Projeto Faculdade',
    descricao: 'Rever slides da aula e terminar exercícios.',
    dataLimite: 'Hoje, 23:59',
    estado: 'por-fazer',
    tipo: 'hoje',
  },
  {
    id: 2,
    titulo: 'Comprar mantimentos',
    projeto: 'Projeto Pessoal',
    descricao: 'Leite, pão, frutas, legumes.',
    dataLimite: '01/02/2026, 18:00',
    estado: 'atrasada',
    tipo: 'atrasadas',
  },
];

  constructor(private router: Router) {}

  irPaginaTarefas() {
    this.router.navigateByUrl('/tarefas'); 
  }

}
