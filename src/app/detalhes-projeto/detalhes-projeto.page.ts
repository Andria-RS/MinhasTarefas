import { Component, OnInit } from '@angular/core';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';

type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

interface ProjetoFront {
  nome: string;
  descricao: string;
  estado: EstadoTarefa;
  categoria: string;
}

@Component({
  selector: 'app-detalhes-projeto',
  templateUrl: './detalhes-projeto.page.html',
  styleUrls: ['./detalhes-projeto.page.scss'],
  standalone: false
})
export class DetalhesProjetoPage implements OnInit {

  isModalAberto = false;

  projeto: ProjetoFront = {
    nome: 'Estudar PMEU',
    descricao: 'Rever matéria, fazer exercícios e preparar resumo.',
    estado: 'por-fazer',
    categoria: 'Escola'
  };

  tarefas: Tarefa[] = [
    {
      id: 1,
      titulo: 'Ler apontamentos',
      projeto: 'Estudar PMEU',
      descricao: 'Capítulos 1 a 3',
      dataLimite: '2026-02-10',
      estado: 'por-fazer',
      // tipo opcional se na interface estiver tipo?: ...
    },
    {
      id: 2,
      titulo: 'Fazer exercícios',
      projeto: 'Estudar PMEU',
      descricao: 'Folha 1 de PMEU',
      dataLimite: '2026-02-12',
      estado: 'feito',
    }
  ];

  constructor() {}

  ngOnInit() {}
}
