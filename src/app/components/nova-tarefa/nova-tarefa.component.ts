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
  @Input() projeto?: number;   // id do projeto vindo de detalhes-projeto
  @Input() categoria?: any;
  @Output() fecharModal = new EventEmitter<Task | null>();

  form!: FormGroup;

  imagemUrl?: string;

  categorias: Category[] = [];
  projetos: ProjetoOption[] = [];

  constructor(
    private fb: FormBuilder,
    private tasksService: TasksService,
    private categoriesService: CategoriesService,
    private projectsService: ProjectsService,
    private imageService: ImageService,
    private notificacoesService: NotificacoesService
  ) {}

  async ngOnInit() {
    // inicializar form
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      categoriaSelecionadaId: [this.categoria ?? null, Validators.required],
      projetoSelecionadoId: [this.projeto ?? null, Validators.required],
      dataLimite: [null, Validators.required],
      descricao: ['', Validators.required],
    });

    // carregar categorias
    this.categorias = await this.categoriesService.getAllCategories();

    // se veio categoria inicial, carrega projetos dessa categoria
    if (!this.projeto && this.categoria) {
      await this.onCategoriaChange();
    }

    // se veio projeto fixo (detalhes-projeto), não precisamos de carregar lista aqui
    if (this.projeto) {
      // opcional: poderias buscar info desse projeto se quisesses mostrar nome
    }
  }

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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.value;

    // se veio projeto pela @Input (detalhes-projeto), usamos esse
    const finalProjectId = this.projeto ?? values.projetoSelecionadoId;

    if (!finalProjectId) {
      return;
    }

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

    const novaTask: Task = {
      project_id: finalProjectId,
      title: values.titulo.trim(),
      description: (values.descricao ?? '').trim() || undefined,
      due_date: dueDate,
      due_time: dueTime,
      image_url: this.imagemUrl || undefined,
      completed: false
    };

    const criada = await this.tasksService.insertTask(novaTask);

    if (criada && criada.id && criada.due_date) {
      const iso = criada.due_time
        ? `${criada.due_date}T${criada.due_time}`
        : `${criada.due_date}T09:00:00`;

      await this.notificacoesService.agendarParaTarefa(
        criada.id,
        criada.title,
        iso
      );

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
