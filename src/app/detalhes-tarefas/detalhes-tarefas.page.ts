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
  projetoId: number;      // id real do projeto
  projetoNome: string;    // nome para mostrar
  descricao: string;
  dataLimite: string;     // ISO completo usado no ion-datetime
  dataData: string;       // texto formatado pt-PT
  dataHora: string;       // texto HH:mm
  estado: EstadoTarefa;
  categoria: string;      // nome da categoria real
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

  // projetos da mesma categoria, para o select do modal
  projetos: { id: number; nome: string }[] = [];

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
      this.router.navigate(['/home']);
      return;
    }

    await this.carregarTarefa();
  }

  // --- Helpers de mapeamento entre Task (BD) e DetalheTarefa (UI) ---

  private async mapTaskToDetalhe(task: Task): Promise<DetalheTarefa> {
    // data/hora
    let isoDataLimite = '';
    let dataFormatada = '';
    let horaFormatada = '';

    if (task.due_date) {
      const base = task.due_date;                 // 'YYYY-MM-DD'
      const time = task.due_time || '00:00:00';   // 'HH:MM:SS'
      isoDataLimite = `${base}T${time}`;

      const d = new Date(isoDataLimite);
      dataFormatada = d.toLocaleDateString('pt-PT');
      horaFormatada = d.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // estado
    const estado: EstadoTarefa = task.completed ? 'feito' : 'por-fazer';

    // projeto + categoria reais
    let categoriaNome = 'Sem categoria';
    let projetoNome = 'Sem projeto';
    let projetoId = task.project_id ?? 0;

    if (task.project_id) {
      const project = await this.projectsService.getProjectById(task.project_id);
      if (project) {
        projetoNome = project.name;
        projetoId = project.id ?? task.project_id;

        if (project.category_id) {
          const categoria: Category | null =
            await this.categoriesService.getCategoryById(project.category_id);
          if (categoria) {
            categoriaNome = categoria.name;
          }

          // carregar projetos da mesma categoria para o select
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

  // --- Carregar tarefa do Supabase ---

  async carregarTarefa() {
    const task = await this.tasksService.getTaskById(this.tarefaId);
    if (!task) {
      this.router.navigate(['/home']);
      return;
    }
    this.tarefa = await this.mapTaskToDetalhe(task);
  }

  // --- Opções / Editar / Eliminar ---

  abrirOpcoesTarefa() {
    this.opcoesService.abrirEditarEliminar(
      'tarefa',
      this.tarefa.titulo,
      () => this.abrirEditarTarefa(),
      async () => {
        await this.tasksService.deleteTask(this.tarefaId);
        this.router.navigate(['/home']);
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

  async guardarEditarTarefa() {
    // atualizar campos de data/hora formatados
    if (this.tarefaEditavel.dataLimite) {
      const d = new Date(this.tarefaEditavel.dataLimite);
      this.tarefaEditavel.dataData = d.toLocaleDateString('pt-PT');
      this.tarefaEditavel.dataHora = d.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // mapear para Task e enviar para Supabase
    const taskToUpdate = this.mapDetalheToTask(this.tarefaEditavel);
    await this.tasksService.updateTask(taskToUpdate);

    // atualizar tarefa em memória e fechar modal
    this.tarefa = { ...this.tarefaEditavel };
    this.fecharEditarTarefa();
  }
}
