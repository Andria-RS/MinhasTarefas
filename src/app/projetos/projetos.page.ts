import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OpcoesService } from '../services/opcoes';
import { ProjectsService, Project } from '../services/projects.service';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';

/** Tipo que define os estados possíveis de um projeto. */
type EstadoProjeto = 'por-fazer' | 'feito';

/**
 * Interface local que representa um projeto para uso no componente.
 * Difere ligeiramente do modelo Project do serviço.
 */
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

/**
 * Componente da página de projetos.
 * Exibe lista de projetos filtrada por categoria, com possibilidade de criar, editar e filtrar.
 * Permite navegar para a página de detalhes de cada projeto.
 * Implementa OnInit para inicialização de formulários e carregamento de dados.
 */
export class ProjetosPage implements OnInit {
  
  /** ID da categoria pela qual os projetos são filtrados. */
  categoriaId!: number;
  
  /** Título da página, dinâmico baseado na categoria selecionada. */
  titulo = 'Projetos';
  
  /** Lista de projetos exibidos atualmente (pode estar filtrada). */
  projetos: Projeto[] = [];
  
  /** Lista completa de projetos sem filtros aplicados. */
  projetosOriginais: Projeto[] = [];
  
  /** Indica se o modal de novo/editar projeto está aberto. */
  isModalProjetoAberto = false;
  
  /** Projeto em modo de edição, ou null se estiver a criar um novo. */
  projetoEmEdicao: Projeto | null = null;
  
  /** Formulário reativo para criar/editar projeto. */
  formProjeto!: FormGroup;

  /**
   * Construtor da página de projetos.
   * Injeta dependências de routing, serviços e FormBuilder para formulários reativos.
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService,
    private projectsService: ProjectsService,
    private categoriesService: CategoriesService,
    private fb: FormBuilder
  ) {}

  /**
   * Método do ciclo de vida Angular chamado na inicialização do componente.
   * Configura o formulário, obtém o categoriaId da rota, busca o nome da categoria e carrega os projetos.
   */
  async ngOnInit() {
    this.formProjeto = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required]
    });

    // Obtém o ID da categoria a partir dos parâmetros da rota
    const param = this.route.snapshot.paramMap.get('categoriaId');
    this.categoriaId = param ? Number(param) : 0;

    // Se há categoria definida, busca seu nome para exibir no título
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

  /**
   * Método do ciclo de vida Ionic chamado antes da página entrar na view.
   * Recarrega os projetos para garantir dados atualizados.
   */
  async ionViewWillEnter() {
    await this.carregarProjetos();
  }

  /** Converte um objeto Project (do serviço) para Projeto (interface local do componente). */
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

  /** Converte um objeto Projeto (interface local) para Project (do serviço). */
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

  /**
   * Carrega todos os projetos da categoria especificada e atualiza as listas local e original.
   * Se não houver categoria definida, limpa a lista de projetos.
   */
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

  /**
   * Filtra os projetos exibidos com base no texto de pesquisa.
   * Pesquisa tanto no nome quanto na descrição do projeto.
   */
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

  /** Navega para a página de detalhes do projeto selecionado. */
  abrirDetalhe(projeto: Projeto) {
    this.router.navigate(['/detalhes-projeto', projeto.id]);
  }

  /** Abre o menu de filtros para ordenar ou resetar a lista de projetos. */
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

  /** Abre o modal para criar um novo projeto. */
  abrirNovoProjeto() {
    this.projetoEmEdicao = null;
    this.formProjeto.reset({
      nome: '',
      descricao: ''
    });
    this.isModalProjetoAberto = true;
  }

  /** Fecha o modal de novo/editar projeto e limpa o formulário. */
  fecharNovoProjeto() {
    this.isModalProjetoAberto = false;
    this.projetoEmEdicao = null;
    this.formProjeto.reset();
  }

  /** Guarda um projeto (novo ou editado) na base de dados. */
  async guardarProjeto() {
    if (this.formProjeto.invalid || !this.categoriaId) {
      this.formProjeto.markAllAsTouched();
      return;
    }

    const nome = this.formProjeto.value.nome.trim();
    const descricao = this.formProjeto.value.descricao.trim();

    if (this.projetoEmEdicao) {
      const atualizado: Projeto = {
        ...this.projetoEmEdicao,
        nome,
        descricao
      };
      await this.projectsService.updateProject(
        this.mapProjetoToProject(atualizado)
      );
    } else {
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