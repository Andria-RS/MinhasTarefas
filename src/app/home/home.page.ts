import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';

type FiltroTarefas = 'hoje' | 'proximas' | 'atrasadas';

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

  constructor(
    private router: Router,
    private tasksService: TasksService
  ) {}

  async ionViewWillEnter() {
    await this.carregarTarefas();
  }

  private mapTaskToTarefa(task: Task, todayStr: string): Tarefa {
    // montar string data/hora legível
    let dataLegivel = '';
    if (task.due_date) {
      const base = task.due_date;                  // 'YYYY-MM-DD'
      const time = task.due_time || '00:00:00';    // 'HH:MM:SS'
      const iso = `${base}T${time}`;
      const d = new Date(iso);
      dataLegivel =
        d.toLocaleDateString('pt-PT') +
        ', ' +
        d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    }

    // estado
    let estado: 'por-fazer' | 'feito' | 'atrasada';
    if (task.completed) {
      estado = 'feito';
    } else if (task.due_date < todayStr) {
      estado = 'atrasada';
    } else {
      estado = 'por-fazer';
    }

    // tipo para o segment (hoje / próximas / atrasadas)
    let tipo: 'hoje' | 'proximas' | 'atrasadas';
    if (task.due_date === todayStr) {
      tipo = 'hoje';
    } else if (task.due_date < todayStr) {
      tipo = 'atrasadas';
    } else {
      tipo = 'proximas';
    }

    return {
      id: task.id || 0,
      titulo: task.title,
      projeto: 'PROJETO', // mais tarde ligamos à tabela projects
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

    // POR ENQUANTO: buscar tarefas de um projeto fixo (id 1) ou ajusta para o que tiveres
    const tasks: Task[] = await this.tasksService.getTasksByProject(1);

    this.tarefas = tasks.map(t => this.mapTaskToTarefa(t, todayStr));
  }

  irPaginaTarefas() {
    this.router.navigateByUrl('/tarefas');
  }

  abrirDetalhesTarefas(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id]);
  }
}
