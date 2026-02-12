import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';
import { OpcoesService } from '../services/opcoes';
import { ProjectsService, Project } from '../services/projects.service';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/** Tipo que define os estados possíveis de um projeto. */
type EstadoProjeto = 'por-fazer' | 'feito';

/** Tipo que define os estados possíveis de uma tarefa. */
type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

/**
 * Interface local que representa um projeto para exibição de detalhes.
 * Inclui informações da categoria associada.
 */
interface ProjetoFront {
  id: number;
  nome: string;
  descricao: string;
  estado: EstadoProjeto;
  categoria: string;
  categoriaId: number;
}

@Component({
  selector: 'app-detalhes-projeto',
  templateUrl: './detalhes-projeto.page.html',
  styleUrls: ['./detalhes-projeto.page.scss'],
  standalone: false
})

/**
 * Componente da página de detalhes de um projeto.
 * Exibe informações do projeto e lista todas as suas tarefas.
 * Permite editar/eliminar o projeto e navegar para detalhes das tarefas.
 * Implementa OnInit e OnDestroy para gestão de subscrições e carregamento de dados.
 */
export class DetalhesProjetoPage implements OnInit, OnDestroy {
   /** Indica se o modal de nova tarefa está aberto. */
  isModalAberto = false;
  
  /** Objeto com os detalhes completos do projeto. */
  projeto!: ProjetoFront;
  
  /** Array de tarefas do projeto. */
  tarefas: Tarefa[] = [];
  
  /** Indica se o modal de editar projeto está aberto. */
  isModalEditarProjetoAberto = false;
  
  /** Cópia do projeto em modo de edição. */
  projetoEditavel!: ProjetoFront;
  
  /** Lista de todas as categorias disponíveis. */
  categorias: Category[] = [];
  
  /** Subscrição aos eventos do router para detetar navegação. */
  private routerSub?: Subscription;
  
  /** ID do projeto atual. */
  private projectId: number = 0;

  /**
   * Construtor da página de detalhes de projeto.
   * Configura subscrição aos eventos do router para recarregar dados quando necessário.
   */
  constructor(
    private opcoesService: OpcoesService,
    private router: Router,
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private categoriesService: CategoriesService,
    private tasksService: TasksService
  ) {
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/detalhes-projeto/') && event.url.includes('_reload') && this.projectId) {
          console.log('Detalhes-Projeto: detectou _reload, a recarregar...');
          this.carregarProjeto(this.projectId).then(() => 
            this.carregarTarefasDoProjeto(this.projeto.id, this.projeto.nome)
          );
        }
      });
  }

  /** Método do ciclo de vida Angular chamado quando o componente é destruído. */
  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  /**
   * Método do ciclo de vida Angular chamado na inicialização.
   * Obtém o ID do projeto da rota, valida, carrega dados do projeto, tarefas e categorias.
   */
  async ngOnInit() {
    const param = this.route.snapshot.paramMap.get('id');
    console.log('detalhes-projeto param id =', param);
    this.projectId = param ? Number(param) : 0;
    console.log('detalhes-projeto projectId =', this.projectId);

    if (!this.projectId) {
      this.router.navigate(['/tabs/home']);
      return;
    }

    await this.carregarProjeto(this.projectId);
    await this.carregarTarefasDoProjeto(this.projeto.id, this.projeto.nome);
    this.categorias = await this.categoriesService.getAllCategories();
    console.log('categorias =', this.categorias);
  }

  /**
   * Método do ciclo de vida Ionic chamado antes da página entrar na view.
   * Recarrega os dados do projeto e tarefas.
   */
  async ionViewWillEnter() {
    console.log(' Detalhes-Projeto: ionViewWillEnter');
    if (this.projectId) {
      await this.carregarProjeto(this.projectId);
      await this.carregarTarefasDoProjeto(this.projeto.id, this.projeto.nome);
    }
  }

  /** Converte um objeto Project (do serviço) para ProjetoFront (interface local). */
  private mapProjectToFront(p: Project): ProjetoFront {
    return {
      id: p.id ?? 0,
      nome: p.name,
      descricao: p.description || '',
      estado: (p.status as EstadoProjeto) || 'por-fazer',
      categoria: '',
      categoriaId: p.category_id
    };
  }

  /** Converte um objeto ProjetoFront (interface local) para Project (do serviço). */
  private mapFrontToProject(p: ProjetoFront): Project {
    return {
      id: p.id,
      name: p.nome,
      description: p.descricao,
      category_id: p.categoriaId,
      status: p.estado
    };
  }

  /**
   * Converte um objeto Task para Tarefa, calculando estado e tipo baseado na data.
   * Similar ao método da home.page.ts.
   */
  private mapTaskToTarefa(task: Task, todayStr: string, projectName: string): Tarefa {
    let dataLegivel = '';
    let deadline: Date | null = null;

    if (task.due_date) {
      const base = task.due_date;
      const time = task.due_time || '00:00:00';
      const iso = `${base}T${time}`;
      const d = new Date(iso);
      deadline = d;

      dataLegivel =
        d.toLocaleDateString('pt-PT') +
        ', ' +
        d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    }

    const now = new Date();

    let estado: 'por-fazer' | 'feito' | 'atrasada';
    if (task.completed) {
      estado = 'feito';
    } else if (deadline && deadline < now) {
      estado = 'atrasada';
    } else {
      estado = 'por-fazer';
    }

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
      projeto: projectName,
      descricao: task.description || '',
      dataLimite: dataLegivel,
      estado,
      tipo
    };
  }

  /**
   * Carrega os dados completos do projeto a partir do serviço.
   * Obtém também o nome da categoria associada.
   */
  async carregarProjeto(projectId: number) {
    console.log('carregarProjeto()', projectId);
    const data = await this.projectsService.getProjectById(projectId);
    console.log('getProjectById data =', data);

    if (!data) {
      this.router.navigate(['/tabs/home']);
      return;
    }

    this.projeto = this.mapProjectToFront(data);
    const categoria: Category | null =
      await this.categoriesService.getCategoryById(this.projeto.categoriaId);
    this.projeto.categoria = categoria ? categoria.name : 'Sem categoria';
    console.log('this.projeto =', this.projeto);
  }

  /**
   * Carrega todas as tarefas do projeto especificado.
   * Calcula a data de hoje e mapeia cada Task para Tarefa com estado apropriado.
   */
  private async carregarTarefasDoProjeto(projectId: number, projectName: string) {
    console.log('carregarTarefasDoProjeto()', projectId);
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const tasks = await this.tasksService.getTasksByProject(projectId);
    console.log('Detalhes-Projeto: tarefas BD =', tasks.length);
    this.tarefas = tasks.map(t => this.mapTaskToTarefa(t, todayStr, projectName));
    console.log('Detalhes-Projeto: tarefas FRONT =', this.tarefas.length);
  }

  /**
   * Abre o menu de opções (editar/eliminar) para o projeto.
   * Após eliminação, navega de volta para a lista de projetos da categoria.
   */
  abrirOpcoesProjeto() {
    this.opcoesService.abrirEditarEliminar(
      'projeto',
      this.projeto.nome,
      () => this.abrirEditarProjeto(),
      async () => {
        await this.projectsService.deleteProject(this.projeto.id);
        this.router.navigate(['/projetos', this.projeto.categoriaId]);
      }
    );
  }

  /** Abre o modal de edição do projeto. */
  abrirEditarProjeto() {
    this.projetoEditavel = { ...this.projeto };
    console.log('ANTES de editar', this.projetoEditavel);
    this.isModalEditarProjetoAberto = true;
  }

  /** Fecha o modal de edição do projeto. */
  fecharEditarProjeto() {
    this.isModalEditarProjetoAberto = false;
  }

  /**
   * Guarda as alterações feitas ao projeto.
   * Atualiza o projeto no serviço e recarrega os dados.
   */
  async guardarEditarProjeto() {
    console.log('A GUARDAR, projetoEditavel =', this.projetoEditavel);
    this.projetoEditavel.categoriaId = Number(this.projetoEditavel.categoriaId);
    await this.projectsService.updateProject(
      this.mapFrontToProject(this.projetoEditavel)
    );
    await this.carregarProjeto(this.projetoEditavel.id);
    this.isModalEditarProjetoAberto = false;
  }

  /**
   * Navega para a página de detalhes de uma tarefa específica.
   * Passa parâmetros indicando que a navegação veio da página de projeto.
   */
  abrirDetalhesTarefas(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id], {
      queryParams: { from: 'project', projectId: this.projeto.id }
    });
  }

  /**
   * Callback chamado quando o modal de nova tarefa é fechado.
   * Se uma tarefa foi criada, recarrega a lista de tarefas do projeto.
   */
  async onNovaTarefaProjetoFechar(task: Task | null) {
    this.isModalAberto = false;
    console.log('Detalhes-Projeto: modal fechou, task?', task ? task.id : 'null');
    if (task && this.projeto) {
      await this.carregarTarefasDoProjeto(this.projeto.id, this.projeto.nome);
    }
  }
}
