import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';
import { ProjectsService, Project } from '../services/projects.service';

type FiltroTarefas = 'hoje' | 'proximas' | 'concluidas' | 'atrasadas';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  filtro: FiltroTarefas = 'hoje';
  isModalAberto = false;

  tarefas: Tarefa[] = [];

  // project_id -> nome do projeto
  private nomesProjetos = new Map<number, string>();

  constructor(
    private router: Router,
    private tasksService: TasksService,
    private projectsService: ProjectsService
  ) {}

  async ionViewWillEnter() {
    await this.carregarProjetos();
    await this.carregarTarefas();
  }

  private async carregarProjetos() {
    const data: Project[] = await this.projectsService.getAllProjects();

    this.nomesProjetos.clear();
    for (const p of data) {
      if (p.id != null) {
        this.nomesProjetos.set(p.id, p.name);
      }
    }
  }

  private mapTaskToTarefa(task: Task, todayStr: string): Tarefa {
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

    let tipo: 'hoje' | 'proximas' | 'concluidas' | 'atrasadas';
    if (task.completed) {
      tipo = 'concluidas';
    } else if (task.due_date === todayStr) {
      tipo = 'hoje';
    } else if (task.due_date < todayStr) {
      tipo = 'atrasadas';
    } else {
      tipo = 'proximas';
    }

    const nomeProjeto =
      (task.project_id != null
        ? this.nomesProjetos.get(task.project_id)
        : undefined) || 'Sem projeto';

    return {
      id: task.id || 0,
      titulo: task.title,
      projeto: nomeProjeto, // ← AQUI aparece o nome real no card
      descricao: task.description || '',
      dataLimite: dataLegivel,
      estado,
      tipo
    };
  }

  async carregarTarefas() {
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const tasks: Task[] = await this.tasksService.getAllTasks();

    this.tarefas = tasks.map(t => this.mapTaskToTarefa(t, todayStr));
  }

  async onModalDismiss(ev: any) {
    this.isModalAberto = false;

    const data = ev?.detail?.data;
    if (data) {
      await this.carregarProjetos();
      await this.carregarTarefas();
    }
  }

  async onNovaTarefaFechar(task: Task | null) {
    this.isModalAberto = false;

    if (task) {
      await this.carregarProjetos();
      await this.carregarTarefas();
    }
  }

  irPaginaTarefas() {
    this.router.navigateByUrl('/tarefas');
  }

  abrirDetalhesTarefas(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id]);
  }
}
