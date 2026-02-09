import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcoesService } from '../services/opcoes';
import { ProjectsService, Project } from '../services/projects.service';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';

type EstadoProjeto = 'por-fazer' | 'feito';

interface Projeto {
  id: number;
  nome: string;
  totalTarefas: number;
  estado: EstadoProjeto;
  descricao?: string;
  categoriaId: number;
}

@Component({
  selector: 'app-projetos',
  templateUrl: './projetos.page.html',
  styleUrls: ['./projetos.page.scss'],
  standalone: false
})
export class ProjetosPage implements OnInit {
  categoriaId!: number;
  titulo = 'Projetos';

  projetos: Projeto[] = [];
  projetosOriginais: Projeto[] = [];

  // modal Novo/Editar projeto
  isModalProjetoAberto = false;
  projetoEmEdicao: Projeto | null = null;
  novoProjetoNome = '';
  novoProjetoDescricao = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService,
    private projectsService: ProjectsService,
    private categoriesService: CategoriesService
  ) {}

  async ngOnInit() {
    const param = this.route.snapshot.paramMap.get('categoriaId');
    this.categoriaId = param ? Number(param) : 0;

    if (this.categoriaId) {
      const categoria: Category | null =
        await this.categoriesService.getCategoryById(this.categoriaId);
      this.titulo = categoria
        ? `Projetos de ${categoria.name}`
        : 'Projetos';
    } else {
      this.titulo = 'Projetos';
    }

    await this.carregarProjetos();
  }

  async ionViewWillEnter() {
    await this.carregarProjetos();
  }

  private mapProjectToProjeto(p: Project): Projeto {
    return {
      id: p.id ?? 0,
      nome: p.name,
      descricao: p.description,
      categoriaId: p.category_id,
      estado: (p.status as EstadoProjeto) || 'por-fazer',
      totalTarefas: p.total_tasks ?? 0
    };
  }

  private mapProjetoToProject(p: Projeto): Project {
    return {
      id: p.id,
      name: p.nome,
      description: p.descricao,
      category_id: p.categoriaId,
      status: p.estado,
      total_tasks: p.totalTarefas
    };
  }

  async carregarProjetos() {
    if (!this.categoriaId) {
      this.projetos = [];
      this.projetosOriginais = [];
      return;
    }

    const data = await this.projectsService.getProjectsByCategory(
      this.categoriaId
    );
    this.projetos = data.map(d => this.mapProjectToProjeto(d));
    this.projetosOriginais = [...this.projetos];
  }

  abrirDetalhe(projeto: Projeto) {
    this.router.navigate(['/detalhes-projeto', projeto.id]);
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
    this.novoProjetoDescricao = '';
    this.isModalProjetoAberto = true;
  }

  fecharNovoProjeto() {
    this.isModalProjetoAberto = false;
    this.projetoEmEdicao = null;
    this.novoProjetoNome = '';
    this.novoProjetoDescricao = '';
  }

  async guardarProjeto() {
    if (!this.novoProjetoNome.trim() || !this.categoriaId) {
      return;
    }

    const nome = this.novoProjetoNome.trim();
    const descricao = this.novoProjetoDescricao.trim();

    if (this.projetoEmEdicao) {
      // EDITAR
      const atualizado: Projeto = {
        ...this.projetoEmEdicao,
        nome,
        descricao
      };
      await this.projectsService.updateProject(
        this.mapProjetoToProject(atualizado)
      );
    } else {
      // NOVO
      await this.projectsService.insertProject({
        name: nome,
        description: descricao,
        category_id: this.categoriaId,
        status: 'por-fazer'
      });
    }

    await this.carregarProjetos();
    this.fecharNovoProjeto();
  }
}
