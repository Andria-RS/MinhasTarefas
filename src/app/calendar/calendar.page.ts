import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';
import { ProjectsService } from '../services/projects.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: false
})
export class CalendarPage implements OnInit {
  todasTarefas: Task[] = [];
  tarefasDoDia: Tarefa[] = [];
  dataSelecionada: string = '';
  projetos: any[] = [];
  highlightedDates!: (dateString: string) => boolean;

  constructor(
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('📅 CalendarPage: Iniciando...');
    
    await this.carregarProjetos();
    await this.carregarTarefas();
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    this.dataSelecionada = hoje.toISOString();
    
    this.filtrarTarefasDoDia();
    this.forcarCapitalizacao();
    
    console.log('📅 Data selecionada:', this.dataSelecionada);
    console.log('📅 Tarefas de hoje:', this.tarefasDoDia.length);
  }

  async carregarProjetos() {
    try {
      this.projetos = await this.projectsService.getAllProjects();
      console.log('📦 Projetos carregados:', this.projetos.length);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      this.projetos = [];
    }
  }

  async carregarTarefas() {
    try {
      this.todasTarefas = await this.tasksService.getAllTasks();
      console.log('✅ Tarefas carregadas:', this.todasTarefas.length);
      
      this.prepararHighlightedDates();
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      this.todasTarefas = [];
    }
  }

  prepararHighlightedDates() {
    const datasComTarefas = new Set(
      this.todasTarefas
        .filter(t => t.due_date)
        .map(t => t.due_date!)
    );
    
    console.log('📌 Dias com tarefas:', Array.from(datasComTarefas));
    
    this.highlightedDates = (dateString: string) => {
      const dateOnly = dateString.split('T')[0];
      const temTarefas = datasComTarefas.has(dateOnly);
      
      if (temTarefas) {
        console.log('🔵 Dia destacado:', dateOnly);
      }
      
      return temTarefas;
    };
  }

  onDateChange(event: any) {
    const novaData = event.detail.value;
    console.log('📅 Data mudou:', novaData);
    
    if (!novaData) {
      this.tarefasDoDia = [];
      return;
    }

    this.dataSelecionada = novaData;
    this.filtrarTarefasDoDia();
  }

  filtrarTarefasDoDia() {
    const dataISO = this.dataSelecionada.split('T')[0];
    
    console.log('🔍 Filtrando tarefas para:', dataISO);
    
    const tasksDoDia = this.todasTarefas.filter(
      tarefa => tarefa.due_date === dataISO
    );
    
    console.log('✅ Tarefas encontradas:', tasksDoDia.length, tasksDoDia);
    
    this.tarefasDoDia = tasksDoDia.map(task => this.convertTaskToTarefa(task));
  }

  private convertTaskToTarefa(task: Task): Tarefa {
    const projeto = this.projetos.find(p => p.id === task.project_id);
    
    return {
      id: task.id!,
      titulo: task.title || 'Sem título',
      projeto: projeto?.name || 'Pessoal',
      descricao: task.description || '',
      dataLimite: this.formatarData(task.due_date, task.due_time),
      estado: this.getEstado(task),
      tipo: this.getTipo(task)
    };
  }

  private formatarData(due_date?: string, due_time?: string): string {
    if (!due_date) return '';
    
    const [ano, mes, dia] = due_date.split('-');
    const dataFormatada = `${dia}-${mes}-${ano}`;
    
    if (due_time) {
      return `${dataFormatada}, ${due_time}`;
    }
    
    return dataFormatada;
  }

  private getEstado(task: Task): 'por-fazer' | 'feito' | 'atrasada' {
    if (task.completed) return 'feito';
    
    const hoje = new Date().toISOString().split('T')[0];
    if (task.due_date && task.due_date < hoje) return 'atrasada';
    
    return 'por-fazer';
  }

  private getTipo(task: Task): 'hoje' | 'proximas' | 'concluidas' | 'atrasadas' {
    const hoje = new Date().toISOString().split('T')[0];
    
    if (task.completed) return 'concluidas';
    if (task.due_date === hoje) return 'hoje';
    if (task.due_date && task.due_date < hoje) return 'atrasadas';
    
    return 'proximas';
  }

  getDataFormatada(): string {
    if (!this.dataSelecionada) return '';
    
    try {
      const data = new Date(this.dataSelecionada);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const dataNormalizada = new Date(data);
      dataNormalizada.setHours(0, 0, 0, 0);
      
      if (dataNormalizada.getTime() === hoje.getTime()) {
        return 'Hoje';
      }
      
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      if (dataNormalizada.getTime() === amanha.getTime()) {
        return 'Amanhã';
      }
      
      return data.toLocaleDateString('pt-PT', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  }

  abrirDetalhesTarefa(tarefa: Tarefa) {
    // ✅ Adiciona queryParams para indicar que veio do calendário
    this.router.navigate(['/detalhes-tarefas', tarefa.id], {
      queryParams: { from: 'calendar' }
    });
  }

  forcarCapitalizacao() {
    setTimeout(() => {
      const monthButton = document.querySelector('ion-datetime')?.shadowRoot
        ?.querySelector('[part="month-year-button"]') as HTMLElement;
      
      if (monthButton) {
        monthButton.style.textTransform = 'capitalize';
      }
    }, 100);
  }
}
