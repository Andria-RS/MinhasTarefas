import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../services/task';
import { CategoriesService } from '../../services/categories.service';
import { Category } from '../../services/category';
import { ProjectsService, Project } from '../../services/projects.service';

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
  @Input() projeto?: number;      // se vier de detalhes-projeto
  @Input() categoria?: any;       // não vamos usar aqui por enquanto

  titulo = '';
  descricao = '';
  dataLimite?: string;
  imagemUrl?: string;

  // selects
  categorias: Category[] = [];
  categoriaSelecionadaId?: number;

  projetos: ProjetoOption[] = [];
  projetoSelecionadoId?: number;

  constructor(
    private modalCtrl: ModalController,
    private tasksService: TasksService,
    private categoriesService: CategoriesService,
    private projectsService: ProjectsService
  ) {}

  async ngOnInit() {
    // 1) carregar categorias da BD
    this.categorias = await this.categoriesService.getAllCategories();

    // 2) se vier de detalhes-projeto, já tens o projeto fixo
    if (this.projeto) {
      this.projetoSelecionadoId = this.projeto;
      // se quiseres, também podias preencher categoriaSelecionadaId aqui com base no projeto
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

    if (criada) {
      await this.modalCtrl.dismiss(criada);
    }
  }

  fechar() {
    this.modalCtrl.dismiss();
  }
}
