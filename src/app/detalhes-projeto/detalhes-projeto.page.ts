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
  imagemUrl: string;
}

@Component({
  selector: 'app-detalhes-projeto',
  templateUrl: './detalhes-projeto.page.html',
  styleUrls: ['./detalhes-projeto.page.scss'],
  standalone: false
})
export class DetalhesProjetoPage implements OnInit {

  // sheet "Nova tarefa" deste projeto
  isModalAberto = false;

  // dados do projeto mostrado na página
  projeto: ProjetoFront = {
    nome: 'Estudar PMEU',
    descricao: 'Rever matéria, fazer exercícios e preparar resumo.',
    estado: 'por-fazer',
    categoria: 'Escola',
    imagemUrl: 'assets/imagens/projetos/estudar-pmeu.jpg'
  };

  // tarefas do projeto (mock)
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

  // -------- SHEET EDITAR PROJETO --------

  isModalEditarProjetoAberto = false;
  projetoEditavel!: ProjetoFront;

  categorias = [
    { id: 'Escola', nome: 'Escola' },
    { id: 'Trabalho', nome: 'Trabalho' },
    { id: 'Pessoal', nome: 'Pessoal' }
  ];

  constructor(
    private opcoesService: OpcoesService,
    private router: Router
  ) {}

  ngOnInit() {}

  // 3 pontinhos do header
  abrirOpcoesProjeto() {
    this.opcoesService.abrirEditarEliminar(
      'projeto',
      this.projeto.nome,
      () => this.abrirEditarProjeto(),   // EDITAR
      () => {                            // ELIMINAR
        console.log('Eliminar projeto', this.projeto);
        // futuramente: apagar projeto e navegar para trás
        // this.router.navigate(['/categorias']);
      }
    );
  }

  // abre a sheet de edição
  abrirEditarProjeto() {
    this.projetoEditavel = { ...this.projeto };
    this.isModalEditarProjetoAberto = true;
  }

  // fecha a sheet sem guardar
  fecharEditarProjeto() {
    this.isModalEditarProjetoAberto = false;
  }

  // guarda alterações feitas no sheet
  guardarEditarProjeto() {
    this.projeto = { ...this.projetoEditavel };
    this.isModalEditarProjetoAberto = false;
    // aqui depois podes chamar um service para persistir no backend
  }

  // navegar para detalhes de tarefa
  abrirDetalhesTarefas(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id]);
  }
}
