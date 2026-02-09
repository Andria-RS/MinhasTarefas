import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';
import { OpcoesService } from '../services/opcoes';
import { ProjectsService, Project } from '../services/projects.service';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';

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

  // tarefas do projeto (vêm da BD)
  tarefas: Tarefa[] = [];

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
    private categoriesService: CategoriesService,
    private tasksService: TasksService
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

    // 2) Carrega as tarefas reais deste projeto
    await this.carregarTarefasDoProjeto(this.projeto.id, this.projeto.nome);

    // 3) Só depois carrega as categorias
    this.categorias = await this.categoriesService.getAllCategories();
    console.log('categorias =', this.categorias);
  }

  // --------- MAP BD → FRONT (PROJETO) ---------

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

  // --------- MAP BD → FRONT (TAREFA, igual à home) ---------

  private mapTaskToTarefa(task: Task, todayStr: string, projectName: string): Tarefa {
    // data/hora legível
    let dataLegivel = '';
    let deadline: Date | null = null;

    if (task.due_date) {
      const base = task.due_date;                 // 'YYYY-MM-DD'
      const time = task.due_time || '00:00:00';   // 'HH:MM:SS'
      const iso = `${base}T${time}`;
      const d = new Date(iso);
      deadline = d;

      dataLegivel =
        d.toLocaleDateString('pt-PT') +
        ', ' +
        d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    }

    const now = new Date();

    // estado (considera data + hora)
    let estado: 'por-fazer' | 'feito' | 'atrasada';
    if (task.completed) {
      estado = 'feito';
    } else if (deadline && deadline < now) {
      estado = 'atrasada';
    } else {
      estado = 'por-fazer';
    }

    // tipo aqui não interessa para filtragem, mas mantemos o campo
    let tipo: 'hoje' | 'proximas' | 'atrasadas';
    if (task.due_date === todayStr) {
      tipo = 'hoje';
    } else if (task.due_date && task.due_date < todayStr) {
      tipo = 'atrasadas';
    } else {
      tipo = 'proximas';
    }

    return {
      id: task.id || 0,
      titulo: task.title,
      projeto: projectName,           // aqui usamos o nome REAL do projeto
      descricao: task.description || '',
      dataLimite: dataLegivel,
      estado,
      tipo
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

  // --------- CARREGAR TAREFAS DO PROJETO ---------

  private async carregarTarefasDoProjeto(projectId: number, projectName: string) {
    console.log('carregarTarefasDoProjeto()', projectId);

    // construir todayStr tal como na home
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const tasks = await this.tasksService.getTasksByProject(projectId);
    console.log('tarefas BD =', tasks);

    this.tarefas = tasks.map(t => this.mapTaskToTarefa(t, todayStr, projectName));
    console.log('tarefas FRONT =', this.tarefas);
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
