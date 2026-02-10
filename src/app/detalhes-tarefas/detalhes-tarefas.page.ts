import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcoesService } from '../services/opcoes';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';
import { ProjectsService } from '../services/projects.service';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';

type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

interface DetalheTarefa {
  id: number;
  titulo: string;
  projetoId: number;
  projetoNome: string;
  descricao: string;
  dataLimite: string;
  dataData: string;
  dataHora: string;
  estado: EstadoTarefa;
  categoria: string;
  categoriaId: number;
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
  categorias: Category[] = [];
  projetos: { id: number; nome: string }[] = [];
  
  private origemNavegacao: string = '';
  private origemProjectId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private categoriesService: CategoriesService
  ) {}

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('tarefaId');
    this.tarefaId = idParam ? +idParam : 0;
    
    if (!this.tarefaId) {
      this.router.navigate(['/tabs/home'], { replaceUrl: true });
      return;
    }

    this.origemNavegacao = this.route.snapshot.queryParamMap.get('from') || '';
    const projId = this.route.snapshot.queryParamMap.get('projectId');
    this.origemProjectId = projId ? +projId : undefined;

    console.log('🔍 Detalhes-Tarefas: origem =', this.origemNavegacao, 'projectId =', this.origemProjectId);

    this.categorias = await this.categoriesService.getAllCategories();
    await this.carregarTarefa();
  }

  private async mapTaskToDetalhe(task: Task): Promise<DetalheTarefa> {
    let isoDataLimite = '';
    let dataFormatada = '';
    let horaFormatada = '';

    if (task.due_date) {
      const base = task.due_date;
      const time = task.due_time || '00:00:00';
      isoDataLimite = `${base}T${time}`;
      const d = new Date(isoDataLimite);
      dataFormatada = d.toLocaleDateString('pt-PT');
      horaFormatada = d.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    const estado: EstadoTarefa = task.completed ? 'feito' : 'por-fazer';

    let categoriaNome = 'Sem categoria';
    let categoriaId = 0;
    let projetoNome = 'Sem projeto';
    let projetoId = task.project_id ?? 0;

    if (task.project_id) {
      const project = await this.projectsService.getProjectById(task.project_id);
      if (project) {
        projetoNome = project.name;
        projetoId = project.id ?? task.project_id;

        if (project.category_id) {
          categoriaId = project.category_id;
          
          const categoria: Category | null =
            await this.categoriesService.getCategoryById(project.category_id);
          if (categoria) {
            categoriaNome = categoria.name;
          }

          const projetosMesmaCategoria = await this.projectsService.getProjectsByCategory(project.category_id);
          this.projetos = projetosMesmaCategoria.map(p => ({
            id: p.id ?? 0,
            nome: p.name
          }));
        }
      }
    }

    return {
      id: task.id || 0,
      titulo: task.title,
      projetoId,
      projetoNome,
      descricao: task.description || '',
      dataLimite: isoDataLimite,
      dataData: dataFormatada,
      dataHora: horaFormatada,
      estado,
      categoria: categoriaNome,
      categoriaId,
      imagemUrl: task.image_url || 'assets/imagens/tarefas/estudar.jpg'
    };
  }

  private mapDetalheToTask(det: DetalheTarefa): Task {
    let due_date = '';
    let due_time: string | undefined = undefined;

    if (det.dataLimite) {
      const d = new Date(det.dataLimite);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      due_date = `${yyyy}-${mm}-${dd}`;

      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      due_time = `${hh}:${mi}:00`;
    }

    const completed = det.estado === 'feito';

    return {
      id: det.id,
      project_id: det.projetoId,
      title: det.titulo,
      description: det.descricao,
      due_date,
      due_time,
      image_url: det.imagemUrl,
      completed
    };
  }

  async carregarTarefa() {
    const task = await this.tasksService.getTaskById(this.tarefaId);
    if (!task) {
      this.router.navigate(['/tabs/home'], { replaceUrl: true });
      return;
    }
    this.tarefa = await this.mapTaskToDetalhe(task);
  }

  // ✅ ATUALIZADO: Volta para a origem correta com _reload
  voltarParaOrigem() {
    console.log('⬅️ Voltar para origem:', this.origemNavegacao);
    
    if (this.origemNavegacao === 'project' && this.origemProjectId) {
      this.router.navigate(['/detalhes-projeto', this.origemProjectId], { 
        queryParams: { _reload: Date.now() }
      });
    } else if (this.origemNavegacao === 'calendar') {
      // ✅ Volta para o calendário com reload
      this.router.navigate(['/tabs/calendar'], { 
        queryParams: { _reload: Date.now() }
      });
    } else {
      // Padrão: volta para home
      this.router.navigate(['/tabs/home'], { 
        queryParams: { _reload: Date.now() }
      });
    }
  }

  // ✅ ATUALIZADO: Apagar tarefa com navegação correta
  abrirOpcoesTarefa() {
    this.opcoesService.abrirEditarEliminar(
      'tarefa',
      this.tarefa.titulo,
      () => this.abrirEditarTarefa(),
      async () => {
        console.log('🗑️ A apagar tarefa', this.tarefaId);
        await this.tasksService.deleteTask(this.tarefaId);
        
        console.log('⬅️ A voltar para origem:', this.origemNavegacao);
        
        if (this.origemNavegacao === 'project' && this.origemProjectId) {
          console.log(' → detalhes-projeto', this.origemProjectId);
          this.router.navigate(['/detalhes-projeto', this.origemProjectId], { 
            queryParams: { _reload: Date.now() }
          });
        } else if (this.origemNavegacao === 'calendar') {
          // ✅ Volta para o calendário após apagar
          console.log(' → calendar');
          this.router.navigate(['/tabs/calendar'], { 
            queryParams: { _reload: Date.now() }
          });
        } else {
          console.log(' → home');
          this.router.navigate(['/tabs/home'], { 
            queryParams: { _reload: Date.now() }
          });
        }
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

  async onCategoriaChangeEditar() {
    if (!this.tarefaEditavel.categoriaId) {
      this.projetos = [];
      this.tarefaEditavel.projetoId = 0;
      return;
    }

    const data = await this.projectsService.getProjectsByCategory(this.tarefaEditavel.categoriaId);
    this.projetos = data.map(p => ({
      id: p.id ?? 0,
      nome: p.name
    }));

    this.tarefaEditavel.projetoId = 0;
  }

  // ✅ ATUALIZADO: Guardar edição e voltar com reload
  async guardarEditarTarefa() {
    if (this.tarefaEditavel.dataLimite) {
      const d = new Date(this.tarefaEditavel.dataLimite);
      this.tarefaEditavel.dataData = d.toLocaleDateString('pt-PT');
      this.tarefaEditavel.dataHora = d.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    const taskToUpdate = this.mapDetalheToTask(this.tarefaEditavel);
    await this.tasksService.updateTask(taskToUpdate);
    
    this.fecharEditarTarefa();
    
    // Recarrega tarefa atualizada
    await this.carregarTarefa();
    
    // ✅ NOVO: Força reload na origem quando fechar o modal
    console.log('💾 Tarefa guardada, preparando reload para:', this.origemNavegacao);
  }
}
