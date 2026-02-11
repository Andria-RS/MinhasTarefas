import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../services/task';
import { CategoriesService } from '../../services/categories.service';
import { Category } from '../../services/category';
import { ProjectsService, Project } from '../../services/projects.service';
import { ImageService } from '../../services/image.service';
import { NotificacoesService } from '../../services/notificacoes.service';
import { getSupabase } from '../../services/supabase.client';
import { construirMensagemNotificacao } from '../../services/notificacoes-text.helper';

interface ProjetoOption {
  id: number;
  nome: string;
}

@Component({
  selector: 'app-nova-tarefa',
  templateUrl: './nova-tarefa.component.html',
  styleUrls: ['./nova-tarefa.component.scss'],
  standalone: false
})
export class NovaTarefaComponent implements OnInit {
  @Input() projeto?: number;
  @Input() categoria?: any;
  @Output() fecharModal = new EventEmitter<Task | null>();

  titulo = '';
  descricao = '';
  dataLimite?: string;
  imagemUrl?: string;

  categorias: Category[] = [];
  categoriaSelecionadaId?: number;
  projetos: ProjetoOption[] = [];
  projetoSelecionadoId?: number;

  constructor(
    private tasksService: TasksService,
    private categoriesService: CategoriesService,
    private projectsService: ProjectsService,
    private imageService: ImageService,
    private notificacoesService: NotificacoesService
  ) {}

  async ngOnInit() {
    this.categorias = await this.categoriesService.getAllCategories();

    if (this.projeto) {
      this.projetoSelecionadoId = this.projeto;
    }
  }

  async onCategoriaChange() {
    if (!this.categoriaSelecionadaId) {
      this.projetos = [];
      this.projetoSelecionadoId = undefined;
      return;
    }

    const data: Project[] =
      await this.projectsService.getProjectsByCategory(this.categoriaSelecionadaId);

    this.projetos = data.map(p => ({
      id: p.id ?? 0,
      nome: p.name
    }));

    this.projetoSelecionadoId = undefined;
  }

  async escolherImagem() {
    const imagem = await this.imageService.pickFromGallery();
    if (imagem) {
      this.imagemUrl = imagem;
      console.log('✅ Imagem selecionada!');
    }
  }

  removerImagem() {
    this.imagemUrl = undefined;
  }

  async criar() {
    if (!this.titulo.trim()) {
      return;
    }

    const finalProjectId = this.projeto ?? this.projetoSelecionadoId;

    if (!finalProjectId) {
      return;
    }

    let dueDate: string;
    let dueTime: string | undefined;

    if (this.dataLimite) {
      const d = new Date(this.dataLimite);
      dueDate = d.toISOString().slice(0, 10);
      dueTime = d.toTimeString().slice(0, 8);
    } else {
      const hoje = new Date();
      dueDate = hoje.toISOString().slice(0, 10);
      dueTime = undefined;
    }

    const novaTask: Task = {
      project_id: finalProjectId,
      title: this.titulo.trim(),
      description: this.descricao.trim() || undefined,
      due_date: dueDate,
      due_time: dueTime,
      image_url: this.imagemUrl || undefined,
      completed: false
    };

    const criada = await this.tasksService.insertTask(novaTask);

    if (criada && criada.id && criada.due_date) {
      // ✅ Local Notifications (1 dia antes + 1 hora antes)
      const iso = criada.due_time
        ? `${criada.due_date}T${criada.due_time}`
        : `${criada.due_date}T09:00:00`;

      await this.notificacoesService.agendarParaTarefa(
        criada.id,
        criada.title,
        iso
      );

      // ✅ Notificação na BD com mensagem estilo "hoje / amanhã / em X dias"
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

    this.fecharModal.emit(criada ?? null);
  }

  fechar() {
    this.fecharModal.emit(null);
  }
}
