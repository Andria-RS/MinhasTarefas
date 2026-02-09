import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';
import { OpcoesService } from '../services/opcoes';
import { ProjectsService, Project } from '../services/projects.service';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';

type EstadoProjeto = 'por-fazer' | 'feito';
type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

interface ProjetoFront {
  id: number;
  nome: string;
  descricao: string;
  estado: EstadoProjeto;
  categoria: string;    // nome real
  categoriaId: number;  // id real da BD
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

  // dados do projeto mostrado na página (vêm da BD)
  projeto!: ProjetoFront;

  // tarefas do projeto (por enquanto mock)
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

  // categorias reais da BD
  categorias: Category[] = [];

  constructor(
    private opcoesService: OpcoesService,
    private router: Router,
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private categoriesService: CategoriesService
  ) {}

  async ngOnInit() {
    const param = this.route.snapshot.paramMap.get('id');
    console.log('detalhes-projeto param id =', param);

    const projectId = param ? Number(param) : 0;
    console.log('detalhes-projeto projectId =', projectId);

    if (!projectId) {
      this.router.navigate(['/tabs/home']);
      return;
    }

    // 1) Carrega o projeto (com categoriaId)
    await this.carregarProjeto(projectId);

    // 2) Só depois carrega as categorias
    this.categorias = await this.categoriesService.getAllCategories();
    console.log('categorias =', this.categorias);
  }


  // --------- MAP BD → FRONT ---------

  private mapProjectToFront(p: Project): ProjetoFront {
    return {
      id: p.id ?? 0,
      nome: p.name,
      descricao: p.description || '',
      estado: (p.status as EstadoProjeto) || 'por-fazer',
      categoria: '',              // vamos preencher com o CategoriesService
      categoriaId: p.category_id
    };
  }

  private mapFrontToProject(p: ProjetoFront): Project {
    return {
      id: p.id,
      name: p.nome,
      description: p.descricao,
      category_id: p.categoriaId,
      status: p.estado
    };
  }

  // --------- CARREGAR PROJETO ---------

  async carregarProjeto(projectId: number) {
    console.log('carregarProjeto()', projectId);
    const data = await this.projectsService.getProjectById(projectId);
    console.log('getProjectById data =', data);

    if (!data) {
      this.router.navigate(['/tabs/home']);
      return;
    }

    this.projeto = this.mapProjectToFront(data);

    // buscar nome real da categoria
    const categoria: Category | null =
      await this.categoriesService.getCategoryById(this.projeto.categoriaId);

    this.projeto.categoria = categoria ? categoria.name : 'Sem categoria';

    console.log('this.projeto =', this.projeto);
  }

  // 3 pontinhos do header
  abrirOpcoesProjeto() {
    this.opcoesService.abrirEditarEliminar(
      'projeto',
      this.projeto.nome,
      () => this.abrirEditarProjeto(),   // EDITAR
      async () => {                      // ELIMINAR
        await this.projectsService.deleteProject(this.projeto.id);
        this.router.navigate(['/projetos', this.projeto.categoriaId]);
      }
    );
  }

  // abre a sheet de edição
  abrirEditarProjeto() {
    this.projetoEditavel = { ...this.projeto };
    console.log('ANTES de editar', this.projetoEditavel);
    this.isModalEditarProjetoAberto = true;
  }

  // fecha a sheet sem guardar
  fecharEditarProjeto() {
    this.isModalEditarProjetoAberto = false;
  }

  // guarda alterações feitas no sheet
  async guardarEditarProjeto() {
    console.log('A GUARDAR, projetoEditavel =', this.projetoEditavel);

    // garantir que categoriaId é número (o ion-select pode mandar string)
    this.projetoEditavel.categoriaId = Number(this.projetoEditavel.categoriaId);

    // atualizar na BD com o que está em projetoEditavel (inclui categoriaId)
    await this.projectsService.updateProject(
      this.mapFrontToProject(this.projetoEditavel)
    );

    // recarregar projeto a partir da BD (para atualizar nome da categoria, etc.)
    await this.carregarProjeto(this.projetoEditavel.id);

    this.isModalEditarProjetoAberto = false;
  }

  // navegar para detalhes de tarefa
  abrirDetalhesTarefas(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id]);
  }
}
