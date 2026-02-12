import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../services/task';
import { CategoriesService } from '../../services/categories.service';
import { Category } from '../../services/category';
import { ProjectsService, Project } from '../../services/projects.service';
import { ImageService } from '../../services/image.service';
import { NotificacoesService } from '../../services/notificacoes.service';
import { getSupabase } from '../../services/supabase.client';
import { construirMensagemNotificacao } from '../../services/notificacoes-text.helper';

/**
 * Interface local para representar um projeto nas opções de seleção.
 */
interface ProjetoOption {
  /** ID do projeto. */
  id: number;
  
  /** Nome do projeto. */
  nome: string;
}

/**
 * Componente modal para criar uma nova tarefa.
 * Permite ao utilizador definir título, categoria, projeto, data/hora limite, descrição e imagem.
 * Após criar a tarefa, agenda notificações locais e sincroniza com a tabela de notificações do Supabase.
 * É usado como modal em várias páginas da aplicação (home, projeto, etc.).
 */
@Component({
  selector: 'app-nova-tarefa',
  templateUrl: './nova-tarefa.component.html',
  styleUrls: ['./nova-tarefa.component.scss'],
  standalone: false
})
export class NovaTarefaComponent implements OnInit {
  
  /** ID do projeto pré-selecionado (opcional, passado pela página pai). */
  @Input() projeto?: number;
  
  /** ID da categoria pré-selecionada (opcional, passado pela página pai). */
  @Input() categoria?: any;
  
  /** Evento emitido quando o modal é fechado, retorna a tarefa criada ou null. */
  @Output() fecharModal = new EventEmitter<Task | null>();

  /** Formulário reativo para criar a nova tarefa. */
  form!: FormGroup;

  /** URL da imagem selecionada para a tarefa (opcional). */
  imagemUrl?: string;

  /** Lista de todas as categorias disponíveis. */
  categorias: Category[] = [];
  
  /** Lista de projetos da categoria selecionada (para dropdown). */
  projetos: ProjetoOption[] = [];

  /**
   * Construtor do componente de nova tarefa.
   * Injeta dependências necessárias para criação de tarefas e gestão de notificações.
   * 
   * @param fb - FormBuilder para criar formulários reativos.
   * @param tasksService - Serviço para gestão de tarefas.
   * @param categoriesService - Serviço para obter categorias.
   * @param projectsService - Serviço para obter projetos.
   * @param imageService - Serviço para selecionar imagens.
   * @param notificacoesService - Serviço para agendar notificações locais.
   */
  constructor(
    private fb: FormBuilder,
    private tasksService: TasksService,
    private categoriesService: CategoriesService,
    private projectsService: ProjectsService,
    private imageService: ImageService,
    private notificacoesService: NotificacoesService
  ) {}

  /**
   * Método do ciclo de vida Angular chamado na inicialização do componente.
   * Configura o formulário reativo com valores pré-selecionados (se existirem).
   * Carrega todas as categorias e, se houver categoria pré-selecionada, carrega os projetos dessa categoria.
   */
  async ngOnInit() {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      categoriaSelecionadaId: [this.categoria ?? null, Validators.required],
      projetoSelecionadoId: [this.projeto ?? null, Validators.required],
      dataLimite: [null, Validators.required],
      descricao: ['', Validators.required],
    });

    this.categorias = await this.categoriesService.getAllCategories();

    if (!this.projeto && this.categoria) {
      await this.onCategoriaChange();
    }
  }

  /**
   * Callback chamado quando a categoria é alterada no formulário.
   * Carrega os projetos da categoria selecionada e limpa o projeto selecionado.
   */
  async onCategoriaChange() {
    const categoriaId = this.form.get('categoriaSelecionadaId')?.value;

    if (!categoriaId) {
      this.projetos = [];
      this.form.get('projetoSelecionadoId')?.setValue(null);
      return;
    }

    const data: Project[] =
      await this.projectsService.getProjectsByCategory(categoriaId);

    this.projetos = data.map(p => ({
      id: p.id ?? 0,
      nome: p.name
    }));

    this.form.get('projetoSelecionadoId')?.setValue(null);
  }

  /**
   * Abre a galeria do dispositivo para o utilizador escolher uma imagem.
   * Se uma imagem for selecionada, armazena-a na propriedade imagemUrl.
   */
  async escolherImagem() {
    const imagem = await this.imageService.pickFromGallery();
    if (imagem) {
      this.imagemUrl = imagem;
      console.log('Imagem selecionada!');
    }
  }

  /**
   * Remove a imagem selecionada da tarefa.
   */
  removerImagem() {
    this.imagemUrl = undefined;
  }

  /**
   * Cria a nova tarefa na base de dados.
   * Valida o formulário, constrói o objeto Task, insere no Supabase.
   * Após criar, agenda notificações locais (1 dia antes e 1 hora antes).
   * Insere também um registo na tabela 'notifications' do Supabase.
   * Emite evento de fecho do modal com a tarefa criada.
   */
  async criar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.value;

    // Usa o projeto pré-selecionado ou o selecionado no formulário
    const finalProjectId = this.projeto ?? values.projetoSelecionadoId;

    if (!finalProjectId) {
      return;
    }

    // Extrai e formata a data e hora limite
    let dueDate: string;
    let dueTime: string | undefined;

    if (values.dataLimite) {
      const d = new Date(values.dataLimite);
      dueDate = d.toISOString().slice(0, 10);
      dueTime = d.toTimeString().slice(0, 8);
    } else {
      const hoje = new Date();
      dueDate = hoje.toISOString().slice(0, 10);
      dueTime = undefined;
    }

    // Constrói o objeto Task
    const novaTask: Task = {
      project_id: finalProjectId,
      title: values.titulo.trim(),
      description: (values.descricao ?? '').trim() || undefined,
      due_date: dueDate,
      due_time: dueTime,
      image_url: this.imagemUrl || undefined,
      completed: false
    };

    // Insere a tarefa na base de dados
    const criada = await this.tasksService.insertTask(novaTask);

    // Se a tarefa foi criada com sucesso e tem data limite, agenda notificações
    if (criada && criada.id && criada.due_date) {
      const iso = criada.due_time
        ? `${criada.due_date}T${criada.due_time}`
        : `${criada.due_date}T09:00:00`;

      // Agenda notificações locais (1 dia antes e 1 hora antes)
      await this.notificacoesService.agendarParaTarefa(
        criada.id,
        criada.title,
        iso
      );

      // Insere registo na tabela 'notifications' do Supabase
      const supabase = getSupabase();
      const mensagem = construirMensagemNotificacao(
        criada.title,
        criada.due_date,
        criada.due_time ?? undefined
      );
      const hora = criada.due_time ?? '09:00:00';

      await supabase.from('notifications').insert({
        tarefa_id: criada.id,
        titulo: criada.title,
        mensagem,
        data: criada.due_date,
        hora,
        lida: false,
      });
    }

    // Emite evento de fecho com a tarefa criada
    this.fecharModal.emit(criada ?? null);
  }

  /**
   * Fecha o modal sem criar tarefa.
   * Emite evento de fecho com null.
   */
  fechar() {
    this.fecharModal.emit(null);
  }
}
