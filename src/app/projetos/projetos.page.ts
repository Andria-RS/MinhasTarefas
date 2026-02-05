import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcoesService } from '../services/opcoes';

type EstadoProjeto = 'por-fazer' | 'feito';

interface Projeto {
  id: string;
  nome: string;
  imagem: string;
  totalTarefas: number;
  estado: EstadoProjeto;
}

@Component({
  selector: 'app-projetos',
  templateUrl: './projetos.page.html',
  styleUrls: ['./projetos.page.scss'],
  standalone: false
})
export class ProjetosPage implements OnInit {
  categoriaId!: string;
  titulo = 'Projetos';

  projetos: Projeto[] = [
    {
      id: 'p1',
      nome: 'Estudar PMEU',
      imagem: 'assets/img/projeto_estudar.png',
      totalTarefas: 5,
      estado: 'por-fazer',
    },
    {
      id: 'p2',
      nome: 'Trabalho de BD',
      imagem: 'assets/img/projeto_bd.png',
      totalTarefas: 8,
      estado: 'feito',
    },
  ];

  // se quiseres restaurar ordem de criação, guarda uma cópia
  projetosOriginais: Projeto[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService
  ) {}

  ngOnInit() {
    this.categoriaId = this.route.snapshot.paramMap.get('categoriaId') || '';

    const nomesCategorias: Record<string, string> = {
      escola: 'Escola',
      trabalho: 'Trabalho',
      casa: 'Casa'
    };

    if (this.categoriaId) {
      const legivel = nomesCategorias[this.categoriaId] || this.categoriaId;
      this.titulo = `Projetos de ${legivel}`;
    } else {
      this.titulo = 'Projetos';
    }

    this.projetosOriginais = [...this.projetos];
  }

  abrirDetalhe(projeto: Projeto) {
    this.router.navigate(['/detalhe-projeto', projeto.id]);
  }

  abrirOpcoesProjeto(projeto: Projeto) {
    this.opcoesService.abrirEditarEliminar(
      'projeto',
      projeto.nome,
      () => {
        console.log('Editar projeto', projeto);
        // TODO: abrir modal/página de edição
      },
      () => {
        console.log('Eliminar projeto', projeto);
        // TODO: remover do array/backend
      }
    );
  }

  abrirFiltrosProjetos() {
    this.opcoesService.abrirFiltros(
      'projetos',
      () => {
        // ordem alfabética
        this.projetos = [...this.projetos].sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );
      },
      () => {
        // ordem de criação original
        this.projetos = [...this.projetosOriginais];
      }
    );
  }
}
