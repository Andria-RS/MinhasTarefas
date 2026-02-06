import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcoesService } from '../services/opcoes';

type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

interface DetalheTarefa {
  id: number;
  titulo: string;
  projeto: string;
  descricao: string;
  dataLimite: string;
  dataData: string;
  dataHora: string;
  estado: EstadoTarefa;
  categoria: string;
  imagemUrl: string;
}

@Component({
  selector: 'app-detalhes-tarefas',
  templateUrl: './detalhes-tarefas.page.html',
  styleUrls: ['./detalhes-tarefas.page.scss'],
  standalone: false
})
export class DetalhesTarefasPage implements OnInit {

  tarefaId!: number;
  tarefa!: DetalheTarefa;

  isModalEditarAberto = false;
  tarefaEditavel!: DetalheTarefa;

  projetos = [
    { id: 'estudar-pmeu', nome: 'Estudar PMEU' },
    { id: 'trabalho-x', nome: 'Trabalho X' }
  ];

  categorias = [
    { id: 'escola', nome: 'escola' },
    { id: 'trabalho', nome: 'trabalho' },
    { id: 'pessoal', nome: 'pessoal' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('tarefaId');
    this.tarefaId = idParam ? +idParam : 0;

    const data = new Date('2026-02-10T18:00:00');

    this.tarefa = {
      id: this.tarefaId,
      titulo: 'Ler apontamentos',
      projeto: 'estudar-pmeu',
      descricao: 'Capítulos 1 a 3, fazer resumo, rever slides.',
      dataLimite: data.toISOString(),
      dataData: '10/02/2026',
      dataHora: '18:00',
      estado: 'por-fazer',
      categoria: 'escola',
      imagemUrl: 'assets/imagens/tarefas/estudar.jpg'
    };
  }

  abrirOpcoesTarefa() {
    this.opcoesService.abrirEditarEliminar(
      'tarefa',
      this.tarefa.titulo,
      () => this.abrirEditarTarefa(),
      () => {
        console.log('Eliminar tarefa', this.tarefaId);
        this.router.navigate(['/home']);
      }
    );
  }

  abrirEditarTarefa() {
    this.tarefaEditavel = { ...this.tarefa };
    this.isModalEditarAberto = true;
  }

  fecharEditarTarefa() {
    this.isModalEditarAberto = false;
  }

  guardarEditarTarefa() {
    if (this.tarefaEditavel.dataLimite) {
      const d = new Date(this.tarefaEditavel.dataLimite);
      this.tarefaEditavel.dataData = d.toLocaleDateString('pt-PT');
      this.tarefaEditavel.dataHora = d.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    this.tarefa = { ...this.tarefaEditavel };
    this.fecharEditarTarefa();
  }
}
