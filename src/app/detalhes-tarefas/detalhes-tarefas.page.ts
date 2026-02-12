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

/** Tipo que define os estados possíveis de uma tarefa. */
type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

/**
 * Interface local que representa os detalhes completos de uma tarefa.
 * Inclui informações do projeto e categoria associados, além de formatação de datas.
 */
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

/**
 * Componente da página de detalhes de uma tarefa.
 * Permite visualizar, editar e eliminar uma tarefa específica.
 * Gere notificações locais e sincronização com a base de dados.
 * Trata navegação de volta para a origem (home, project, calendar).
 */
export class DetalhesTarefasPage implements OnInit {
  /** ID da tarefa a ser exibida (obtido da rota). */
  tarefaId!: number;
  
  /** Objeto com os detalhes completos da tarefa. */
  tarefa!: DetalheTarefa;
  
  /** Indica se o modal de editar tarefa está aberto. */
  isModalEditarAberto = false;
  
  /** Cópia da tarefa em modo de edição. */
  tarefaEditavel!: DetalheTarefa;
  
  /** Lista de todas as categorias disponíveis. */
  categorias: Category[] = [];
  
  /** Lista de projetos da categoria selecionada (para dropdown de edição). */
  projetos: { id: number; nome: string }[] = [];
  
  /** Formulário reativo para editar a tarefa. */
  formEditar!: FormGroup;
  
  /** Origem da navegação (home, project, calendar) para retorno correto. */
  private origemNavegacao: string = '';
  
  /** ID do projeto de origem, se navegação veio da página de projeto. */
  private origemProjectId?: number;

  /**
   * Construtor da página de detalhes de tarefa.
   * Injeta todas as dependências necessárias para gestão da tarefa.
   */
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

  /**
   * Método do ciclo de vida Angular chamado na inicialização do componente.
   * Obtém o ID da tarefa da rota, valida, carrega categorias e a tarefa.
   * Também obtém informações sobre a origem da navegação para retorno correto.
   */
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

  /**
   * Converte um objeto Task (do serviço) para DetalheTarefa (interface local).
   * Carrega informações completas do projeto e categoria associados.
   * Formata datas e horas para exibição em português.
   * Carrega também os projetos da mesma categoria para o dropdown de edição.
   */
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

  /**
   * Converte um objeto DetalheTarefa (interface local) para Task (do serviço).
   * Converte as datas formatadas de volta para formato ISO.
   */
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

  /**
   * Carrega os dados completos da tarefa a partir do serviço.
   * Se a tarefa não existir, redireciona para a home.
   * Inicializa o formulário de edição com os dados da tarefa.
   */
  async carregarTarefa() {
    const task = await this.tasksService.getTaskById(this.tarefaId);
    if (!task) {
      this.router.navigate(['/tabs/home'], { replaceUrl: true });
      return;
    }

    this.tarefa = await this.mapTaskToDetalhe(task);

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

  /**
   * Retorna à página de origem da navegação.
   * Pode ser home, página de projeto ou calendário.
   * Adiciona parâmetro _reload para forçar atualização dos dados.
   */
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

  /**
   * Abre o menu de opções (editar/eliminar) para a tarefa.
   * Configura callbacks para edição e eliminação.
   * Após eliminação, retorna à página de origem.
   */
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

  /**
   * Abre o modal de edição da tarefa.
   * Preenche o formulário com os dados atuais da tarefa.
   */
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

  /** Fecha o modal de edição da tarefa. */
  fecharEditarTarefa() {
    this.isModalEditarAberto = false;
  }

  /**
   * Callback chamado quando a categoria é alterada no formulário de edição.
   * Carrega os projetos da nova categoria selecionada e limpa o projeto selecionado.
   */
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

  /**
   * Callback chamado quando uma nova imagem é selecionada.
   * Lê o ficheiro e converte para DataUrl para armazenamento.
   */
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

  /** Remove a imagem da tarefa em edição. */
  removerImagemEditar() {
    this.formEditar.get('imagemUrl')?.setValue('');
    if (this.tarefaEditavel) {
      this.tarefaEditavel.imagemUrl = '';
    }
  }

  /**
   * Guarda as alterações feitas à tarefa.
   * Valida o formulário, atualiza a tarefa no serviço.
   * Agenda/atualiza notificações locais.
   * Sincroniza com a tabela de notificações do Supabase.
   */
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
      categoria: this.tarefa.categoria,
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
