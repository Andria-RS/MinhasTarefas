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
  descricao?: string;
  categoriaId?: string;
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
      descricao: 'Rever matéria, fazer exercícios…',
      categoriaId: 'escola'
    },
    {
      id: 'p2',
      nome: 'Trabalho de BD',
      imagem: 'assets/img/projeto_bd.png',
      totalTarefas: 8,
      estado: 'feito',
      descricao: 'Trabalho prático de base de dados',
      categoriaId: 'escola'
    },
  ];

  projetosOriginais: Projeto[] = [];

  // modal Novo/Editar projeto
  isModalProjetoAberto = false;
  projetoEmEdicao: Projeto | null = null;
  novoProjetoNome = '';
  novoProjetoImagem = '';
  novoProjetoDescricao = '';

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
      // no futuro: filtrar projetos por categoriaId
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
        // EDITAR → abre o mesmo modal, preenchido
        this.projetoEmEdicao = projeto;
        this.novoProjetoNome = projeto.nome;
        this.novoProjetoImagem = projeto.imagem;
        this.novoProjetoDescricao = projeto.descricao || '';
        this.isModalProjetoAberto = true;
      },
      () => {
        console.log('Eliminar projeto', projeto);
        // se quiseres apagar mesmo já:
        // this.projetos = this.projetos.filter(p => p.id !== projeto.id);
      }
    );
  }

  abrirFiltrosProjetos() {
    this.opcoesService.abrirFiltros(
      'projetos',
      () => {
        this.projetos = [...this.projetos].sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );
      },
      () => {
        this.projetos = [...this.projetosOriginais];
      }
    );
  }

  // ---------- NOVO / EDITAR PROJETO (sheet modal) ----------

  abrirNovoProjeto() {
    this.projetoEmEdicao = null;
    this.novoProjetoNome = '';
    this.novoProjetoImagem = '';
    this.novoProjetoDescricao = '';
    this.isModalProjetoAberto = true;
  }

  fecharNovoProjeto() {
    this.isModalProjetoAberto = false;
    this.projetoEmEdicao = null;
    this.novoProjetoNome = '';
    this.novoProjetoImagem = '';
    this.novoProjetoDescricao = '';
  }

  guardarProjeto() {
    if (!this.novoProjetoNome.trim()) {
      return;
    }

    const nome = this.novoProjetoNome.trim();
    const imagem = this.novoProjetoImagem.trim() || 'assets/img/projeto_default.png';
    const descricao = this.novoProjetoDescricao.trim();

    if (this.projetoEmEdicao) {
      // EDITAR
      this.projetoEmEdicao.nome = nome;
      this.projetoEmEdicao.imagem = imagem;
      this.projetoEmEdicao.descricao = descricao;
    } else {
      // NOVO
      const novo: Projeto = {
        id: nome.toLowerCase().replace(/\s+/g, '-'),
        nome,
        imagem,
        descricao,
        totalTarefas: 0,
        estado: 'por-fazer',
        categoriaId: this.categoriaId
      };
      this.projetos = [...this.projetos, novo];
      this.projetosOriginais = [...this.projetos];
    }

    this.fecharNovoProjeto();
  }
}
