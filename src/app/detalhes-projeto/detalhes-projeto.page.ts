import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';
import { OpcoesService } from '../services/opcoes';

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
      dataLimite: '10-02-2026, 18:00',
      estado: 'por-fazer'
    },
    {
      id: 2,
      titulo: 'Fazer exercícios',
      projeto: 'Estudar PMEU',
      descricao: 'Folha 1 de PMEU',
      dataLimite: '12-02-2026, 23:59',
      estado: 'feito'
    }
  ];

  constructor(
    private opcoesService: OpcoesService,
    private router: Router
  ) {}

  ngOnInit() {}

  abrirOpcoesProjeto() {
    this.opcoesService.abrirEditarEliminar(
      'projeto',
      this.projeto.nome,
      () => {
        console.log('Editar projeto', this.projeto);
        // aqui depois abres o modal/página para editar o projeto
      },
      () => {
        console.log('Eliminar projeto', this.projeto);
        // aqui depois apagas o projeto e, por exemplo, navegas para trás
      }
    );
  }

  abrirDetalhesTarefas(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id]);
  }
}
