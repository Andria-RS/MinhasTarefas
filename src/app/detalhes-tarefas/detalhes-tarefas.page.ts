import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OpcoesService } from '../services/opcoes';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';
import { ProjectsService } from '../services/projects.service';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';
import { NotificacoesService } from '../services/notificacoes.service';
import { getSupabase } from '../services/supabase.client';
import { construirMensagemNotificacao } from '../services/notificacoes-text.helper';

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

  formEditar!: FormGroup;

  private origemNavegacao: string = '';
  private origemProjectId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private categoriesService: CategoriesService,
    private notificacoesService: NotificacoesService,
    private fb: FormBuilder
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

          const projetosMesmaCategoria =
            await this.projectsService.getProjectsByCategory(project.category_id);
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

    // inicializar/atualizar reactive form
    this.formEditar = this.fb.group({
      titulo: [this.tarefa.titulo, Validators.required],
      dataLimite: [this.tarefa.dataLimite || null, Validators.required],
      descricao: [this.tarefa.descricao, Validators.required],
      categoriaId: [this.tarefa.categoriaId || null, Validators.required],
      projetoId: [this.tarefa.projetoId || null, Validators.required],
      estado: [this.tarefa.estado, Validators.required],
      imagemUrl: [this.tarefa.imagemUrl]
    });
  }

  voltarParaOrigem() {
    if (this.origemNavegacao === 'project' && this.origemProjectId) {
      this.router.navigate(['/detalhes-projeto', this.origemProjectId], {
        queryParams: { _reload: Date.now() }
      });
    } else if (this.origemNavegacao === 'calendar') {
      this.router.navigate(['/tabs/calendar'], {
        queryParams: { _reload: Date.now() }
      });
    } else {
      this.router.navigate(['/tabs/home'], {
        queryParams: { _reload: Date.now() }
      });
    }
  }

  abrirOpcoesTarefa() {
    this.opcoesService.abrirEditarEliminar(
      'tarefa',
      this.tarefa.titulo,
      () => this.abrirEditarTarefa(),
      async () => {
        await this.tasksService.deleteTask(this.tarefaId);

        if (this.origemNavegacao === 'project' && this.origemProjectId) {
          this.router.navigate(['/detalhes-projeto', this.origemProjectId], {
            queryParams: { _reload: Date.now() }
          });
        } else if (this.origemNavegacao === 'calendar') {
          this.router.navigate(['/tabs/calendar'], {
            queryParams: { _reload: Date.now() }
          });
        } else {
          this.router.navigate(['/tabs/home'], {
            queryParams: { _reload: Date.now() }
          });
        }
      }
    );
  }

  abrirEditarTarefa() {
    this.tarefaEditavel = { ...this.tarefa };

    if (this.formEditar) {
      this.formEditar.setValue({
        titulo: this.tarefa.titulo,
        dataLimite: this.tarefa.dataLimite || null,
        descricao: this.tarefa.descricao,
        categoriaId: this.tarefa.categoriaId || null,
        projetoId: this.tarefa.projetoId || null,
        estado: this.tarefa.estado,
        imagemUrl: this.tarefa.imagemUrl
      });
    }

    this.isModalEditarAberto = true;
  }

  fecharEditarTarefa() {
    this.isModalEditarAberto = false;
  }

  async onCategoriaChangeEditar() {
    const categoriaId = this.formEditar.get('categoriaId')?.value;
    if (!categoriaId) {
      this.projetos = [];
      this.formEditar.get('projetoId')?.setValue(null);
      return;
    }

    const data = await this.projectsService.getProjectsByCategory(categoriaId);
    this.projetos = data.map(p => ({
      id: p.id ?? 0,
      nome: p.name
    }));

    this.formEditar.get('projetoId')?.setValue(null);
  }

  onImageSelectedEditar(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        this.formEditar.get('imagemUrl')?.setValue(url);
        if (this.tarefaEditavel) {
          this.tarefaEditavel.imagemUrl = url;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removerImagemEditar() {
    this.formEditar.get('imagemUrl')?.setValue('');
    if (this.tarefaEditavel) {
      this.tarefaEditavel.imagemUrl = '';
    }
  }

  async guardarEditarTarefa() {
    if (this.formEditar.invalid) {
      this.formEditar.markAllAsTouched();
      return;
    }

    const v = this.formEditar.value;

    this.tarefaEditavel = {
      ...this.tarefaEditavel,
      titulo: v.titulo,
      dataLimite: v.dataLimite,
      descricao: v.descricao,
      categoriaId: v.categoriaId,
      projetoId: v.projetoId,
      estado: v.estado,
      imagemUrl: v.imagemUrl || this.tarefaEditavel.imagemUrl,
      dataData: '',
      dataHora: '',
      categoria: this.tarefa.categoria, // será recalculado se precisares
      projetoNome: this.tarefa.projetoNome
    };

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

    if (taskToUpdate.id && taskToUpdate.due_date) {
      const iso = taskToUpdate.due_time
        ? `${taskToUpdate.due_date}T${taskToUpdate.due_time}`
        : `${taskToUpdate.due_date}T09:00:00`;

      await this.notificacoesService.cancelarDaTarefa(taskToUpdate.id);
      await this.notificacoesService.agendarParaTarefa(
        taskToUpdate.id,
        taskToUpdate.title,
        iso
      );

      const supabase = getSupabase();
      const mensagem = construirMensagemNotificacao(
        taskToUpdate.title,
        taskToUpdate.due_date,
        taskToUpdate.due_time ?? undefined
      );
      const hora = taskToUpdate.due_time ?? '09:00:00';

      await supabase.from('notifications')
        .upsert(
          {
            tarefa_id: taskToUpdate.id,
            titulo: taskToUpdate.title,
            mensagem,
            data: taskToUpdate.due_date,
            hora,
            lida: false
          },
          { onConflict: 'tarefa_id' }
        );
    }

    this.fecharEditarTarefa();
    await this.carregarTarefa();
  }
}
