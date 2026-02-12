import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  formProjeto!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService,
    private projectsService: ProjectsService,
    private categoriesService: CategoriesService,
    private fb: FormBuilder
  ) {}

  async ngOnInit() {
    this.formProjeto = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required]
    });

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
    this.projetosOriginais = data.map(d => this.mapProjectToProjeto(d));
    this.projetos = [...this.projetosOriginais];
  }

  // SEARCHBAR
  filtrarProjetos(ev: any) {
    const texto: string = (ev.detail?.value || '').toLowerCase().trim();

    if (!texto) {
      this.projetos = [...this.projetosOriginais];
      return;
    }

    this.projetos = this.projetosOriginais.filter(p =>
      (p.nome || '').toLowerCase().includes(texto) ||
      (p.descricao || '').toLowerCase().includes(texto)
    );
  }

  abrirDetalhe(projeto: Projeto) {
    this.router.navigate(['/detalhes-projeto', projeto.id]);
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
        // ordem original (como veio da BD)
        this.projetos = [...this.projetosOriginais];
      }
    );
  }

  // ---------- NOVO / EDITAR PROJETO (sheet modal) ----------

  abrirNovoProjeto() {
    this.projetoEmEdicao = null;
    this.formProjeto.reset({
      nome: '',
      descricao: ''
    });
    this.isModalProjetoAberto = true;
  }

  fecharNovoProjeto() {
    this.isModalProjetoAberto = false;
    this.projetoEmEdicao = null;
    this.formProjeto.reset();
  }

  async guardarProjeto() {
    if (this.formProjeto.invalid || !this.categoriaId) {
      this.formProjeto.markAllAsTouched();
      return;
    }

    const nome = this.formProjeto.value.nome.trim();
    const descricao = this.formProjeto.value.descricao.trim();

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
