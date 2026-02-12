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

type EstadoProjeto = 'por-fazer' | 'feito';
type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

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
export class DetalhesProjetoPage implements OnInit, OnDestroy {
  isModalAberto = false;
  
  projeto!: ProjetoFront;
  tarefas: Tarefa[] = [];

  isModalEditarProjetoAberto = false;
  projetoEditavel!: ProjetoFront;

  categorias: Category[] = [];

  private routerSub?: Subscription;
  private projectId: number = 0;

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

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

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

  async ionViewWillEnter() {
    console.log(' Detalhes-Projeto: ionViewWillEnter');
    if (this.projectId) {
      await this.carregarProjeto(this.projectId);
      await this.carregarTarefasDoProjeto(this.projeto.id, this.projeto.nome);
    }
  }

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

  private mapFrontToProject(p: ProjetoFront): Project {
    return {
      id: p.id,
      name: p.nome,
      description: p.descricao,
      category_id: p.categoriaId,
      status: p.estado
    };
  }

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

  abrirEditarProjeto() {
    this.projetoEditavel = { ...this.projeto };
    console.log('ANTES de editar', this.projetoEditavel);
    this.isModalEditarProjetoAberto = true;
  }

  fecharEditarProjeto() {
    this.isModalEditarProjetoAberto = false;
  }

  async guardarEditarProjeto() {
    console.log('A GUARDAR, projetoEditavel =', this.projetoEditavel);

    this.projetoEditavel.categoriaId = Number(this.projetoEditavel.categoriaId);

    await this.projectsService.updateProject(
      this.mapFrontToProject(this.projetoEditavel)
    );

    await this.carregarProjeto(this.projetoEditavel.id);
    this.isModalEditarProjetoAberto = false;
  }

  abrirDetalhesTarefas(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id], {
      queryParams: { from: 'project', projectId: this.projeto.id }
    });
  }

  async onNovaTarefaProjetoFechar(task: Task | null) {
    this.isModalAberto = false;

    console.log('Detalhes-Projeto: modal fechou, task?', task ? task.id : 'null');
    if (task && this.projeto) {
      await this.carregarTarefasDoProjeto(this.projeto.id, this.projeto.nome);
    }
  }
}
