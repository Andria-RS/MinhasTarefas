import { Component, OnInit } from '@angular/core';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: false
})
export class CalendarPage implements OnInit {

  tarefasHoje: Tarefa[] = [
    {
      id: 1,
      titulo: 'Nome da tarefa',
      projeto: 'Estudar PMEU',
      descricao: 'Alguma descrição rápida',
      dataLimite: '06-02-2026',
      estado: 'feito'
    }
  ];

  constructor() { }

  ngOnInit() { }
}
