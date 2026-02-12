import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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

/**
 * Componente da página de calendário.
 * Exibe um calendário Ionic com destaque para dias com tarefas agendadas.
 * Permite selecionar uma data e visualizar as tarefas desse dia.
 * Implementa OnInit e OnDestroy para gestão de subscrições e carregamento de dados.
 */
export class CalendarPage implements OnInit, OnDestroy {
  /** Array com todas as tarefas carregadas da base de dados. */
  todasTarefas: Task[] = [];

  /** Array de tarefas convertidas para exibição do dia selecionado. */
  tarefasDoDia: Tarefa[] = [];

  /** Data atualmente selecionada no calendário (formato ISO string). */
  dataSelecionada: string = '';

  /** Lista de todos os projetos (para obter nomes). */
  projetos: any[] = [];

  /** Função que determina quais datas devem ser destacadas no calendário. */
  highlightedDates!: (dateString: string) => boolean;
  
  /** Subscrição aos eventos do router para detetar navegação e recarregar dados. */
  private routerSub?: Subscription;

  /**
   * Construtor da página de calendário.
   * Configura subscrição aos eventos do router para recarregar dados quando necessário.
   */
  constructor(
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/tabs/calendar') && event.url.includes('_reload')) {
          console.log('Calendar: detectou _reload na URL, a recarregar...');
          this.carregarProjetos().then(() => this.carregarTarefas()).then(() => this.filtrarTarefasDoDia());
        }
      });
  }

  /** Método do ciclo de vida Angular chamado quando o componente é destruído. */
  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  /**
   * Método do ciclo de vida Angular chamado na inicialização.
   * Carrega projetos e tarefas, define a data inicial como hoje e filtra tarefas do dia.
   * Força capitalização do botão de mês/ano do calendário.
   */
  async ngOnInit() {
    console.log('CalendarPage: Iniciando...');
    
    await this.carregarProjetos();
    await this.carregarTarefas();
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    this.dataSelecionada = hoje.toISOString();
    
    this.filtrarTarefasDoDia();
    this.forcarCapitalizacao();
    
    console.log('Data selecionada:', this.dataSelecionada);
    console.log('Tarefas de hoje:', this.tarefasDoDia.length);
  }

  /**
   * Método do ciclo de vida Ionic chamado antes da página entrar na view.
   * Recarrega projetos, tarefas e atualiza as tarefas do dia.
   */
  async ionViewWillEnter() {
    console.log('Calendar: ionViewWillEnter');
    await this.carregarProjetos();
    await this.carregarTarefas();
    this.filtrarTarefasDoDia();
  }

  /**
   * Carrega todos os projetos da base de dados.
   * Array de projetos é usado para obter nomes ao converter Task para Tarefa.
   */
  async carregarProjetos() {
    try {
      this.projetos = await this.projectsService.getAllProjects();
      console.log('Projetos carregados:', this.projetos.length);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      this.projetos = [];
    }
  }

  /**
   * Carrega todas as tarefas da base de dados.
   * Após carregar, prepara a função de highlight para marcar dias com tarefas no calendário.
   */
  async carregarTarefas() {
    try {
      this.todasTarefas = await this.tasksService.getAllTasks();
      console.log('Tarefas carregadas:', this.todasTarefas.length);
      
      this.prepararHighlightedDates();
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      this.todasTarefas = [];
    }
  }

  /**
   * Prepara a função que determina quais datas devem ser destacadas no calendário.
   * Cria um Set com todas as datas (due_date) que têm tarefas associadas.
   */
  prepararHighlightedDates() {
    const datasComTarefas = new Set(
      this.todasTarefas
        .filter(t => t.due_date)
        .map(t => t.due_date!)
    );
    
    console.log('Dias com tarefas:', Array.from(datasComTarefas));
    
    this.highlightedDates = (dateString: string) => {
      const dateOnly = dateString.split('T')[0];
      return datasComTarefas.has(dateOnly);
    };
  }

  /**
   * Callback chamado quando o utilizador seleciona uma nova data no calendário.
   * Atualiza a data selecionada e filtra as tarefas para essa data.
   * @param event - Evento do ion-datetime contendo a nova data.
   */
  onDateChange(event: any) {
    const novaData = event.detail.value;
    console.log('Data mudou:', novaData);
    
    if (!novaData) {
      this.tarefasDoDia = [];
      return;
    }

    this.dataSelecionada = novaData;
    this.filtrarTarefasDoDia();
  }

  /**
   * Filtra as tarefas para exibir apenas as da data atualmente selecionada.
   * Compara o due_date das tarefas com a data selecionada (apenas parte da data, sem hora).
   */
  filtrarTarefasDoDia() {
    const dataISO = this.dataSelecionada.split('T')[0];
    
    console.log('Filtrando tarefas para:', dataISO);
    
    const tasksDoDia = this.todasTarefas.filter(
      tarefa => tarefa.due_date === dataISO
    );
    
    console.log('Tarefas encontradas:', tasksDoDia.length);
    
    this.tarefasDoDia = tasksDoDia.map(task => this.convertTaskToTarefa(task));
  }

  /**
   * Converte um objeto Task (do serviço) para Tarefa (para exibição em cartões).
   * Obtém o nome do projeto associado e formata datas/estados.
   * @param task - Tarefa a converter.
   * @returns Objeto Tarefa pronto para exibição.
   */
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

  /**
   * Formata uma data e hora para exibição em português (DD-MM-YYYY, HH:MM).
   * @param due_date - Data no formato YYYY-MM-DD.
   * @param due_time - Hora no formato HH:MM:SS (opcional).
   * @returns String formatada ou vazia.
   */
  private formatarData(due_date?: string, due_time?: string): string {
    if (!due_date) return '';
    
    const [ano, mes, dia] = due_date.split('-');
    const dataFormatada = `${dia}-${mes}-${ano}`;
    
    if (due_time) {
      return `${dataFormatada}, ${due_time}`;
    }
    
    return dataFormatada;
  }

  /**
   * Determina o estado de uma tarefa (por-fazer, feito, atrasada).
   * Compara a data/hora limite com o momento atual.
   * @param task - Tarefa a avaliar.
   * @returns Estado da tarefa.
   */
  private getEstado(task: Task): 'por-fazer' | 'feito' | 'atrasada' {
    if (task.completed) return 'feito';
    
    if (!task.due_date) return 'por-fazer';
    
    const dueDatetime = new Date(`${task.due_date}T${task.due_time || '23:59:59'}`);
    const agora = new Date();
    
    if (dueDatetime < agora) {
      console.log('Tarefa atrasada:', task.title);
      return 'atrasada';
    }
    
    return 'por-fazer';
  }

  /**
   * Determina o tipo/categoria de uma tarefa para filtros (hoje, próximas, concluídas, atrasadas).
   * @param task - Tarefa a avaliar.
   * @returns Tipo da tarefa.
   */
  private getTipo(task: Task): 'hoje' | 'proximas' | 'concluidas' | 'atrasadas' {
    if (task.completed) return 'concluidas';
    
    if (!task.due_date) return 'proximas';
    
    const hoje = new Date().toISOString().split('T')[0];
    
    if (task.due_date === hoje) {
      const dueDatetime = new Date(`${task.due_date}T${task.due_time || '23:59:59'}`);
      const agora = new Date();
      
      if (dueDatetime < agora) {
        return 'atrasadas';
      }
      return 'hoje';
    }
    
    if (task.due_date < hoje) {
      return 'atrasadas';
    }
    
    return 'proximas';
  }

  /**
   * Formata a data selecionada para exibição amigável.
   * Retorna "Hoje", "Amanhã" ou o nome do dia da semana com data completa em português.
   * @returns String formatada da data selecionada.
   */
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

  /**
   * Navega para a página de detalhes de uma tarefa específica.
   * Passa parâmetro indicando que a navegação veio do calendário.
   * @param tarefa - Tarefa cujos detalhes devem ser exibidos.
   */
  abrirDetalhesTarefa(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id], {
      queryParams: { from: 'calendar' }
    });
  }

  /**
   * Força a capitalização do botão de mês/ano no componente ion-datetime.
   * Acede ao Shadow DOM do componente Ionic para aplicar estilo CSS.
   * Executado com timeout para garantir que o DOM está renderizado.
   */
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
