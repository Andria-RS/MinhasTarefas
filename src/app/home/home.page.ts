import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Tarefa } from '../components/cartoes-tarefas/cartoes-tarefas.component';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';
import { ProjectsService, Project } from '../services/projects.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Tipo que define os filtros possíveis para visualização de tarefas na página inicial.
 */
type FiltroTarefas = 'hoje' | 'proximas' | 'concluidas' | 'atrasadas';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

/**
 * Componente da página inicial (Home).
 * Exibe as tarefas do utilizador organizadas por filtros: hoje, próximas, concluídas e atrasadas.
 * Carrega dados de projetos e tarefas do Supabase e permite navegar para detalhes das tarefas.
 * Implementa OnDestroy para limpar subscrições quando o componente é destruído.
 */
export class HomePage implements OnDestroy {
  /** Filtro atualmente ativo na visualização de tarefas. */
  filtro: FiltroTarefas = 'hoje';

  /** Indica se o modal de nova tarefa está aberto. */
  isModalAberto = false;

  /** Array de tarefas a serem exibidas na interface. */
  tarefas: Tarefa[] = [];

  /** Mapa que associa IDs de projetos aos seus nomes (cache para performance). */
  private nomesProjetos = new Map<number, string>();

  /** Subscrição aos eventos do router para detetar navegação e recarregar dados. */
  private routerSub?: Subscription;

  /**
   * Construtor da página Home.
   * Injeta dependências de routing e serviços de tarefas/projetos.
   * Configura subscrição aos eventos de navegação para recarregar dados quando necessário.
   * 
   * @param router - Serviço de roteamento Angular.
   * @param route - Rota ativada atual.
   * @param tasksService - Serviço para gestão de tarefas.
   * @param projectsService - Serviço para gestão de projetos.
   */
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tasksService: TasksService,
    private projectsService: ProjectsService
  ) {
    // Subscreve aos eventos de navegação para detetar quando a página é recarregada via URL
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('/tabs/home') && event.url.includes('_reload')) {
          console.log('Home: detectou _reload na URL, a recarregar...');
          this.carregarProjetos().then(() => this.carregarTarefas());
        }
      });
  }

  /**
   * Método do ciclo de vida Angular chamado quando o componente é destruído.
   * Remove a subscrição aos eventos do router para evitar memory leaks.
   */
  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  /**
   * Método do ciclo de vida Ionic chamado antes da página entrar na view.
   * Carrega os projetos e as tarefas do utilizador.
   */
  async ionViewWillEnter() {
    console.log('Home: ionViewWillEnter');
    await this.carregarProjetos();
    await this.carregarTarefas();
  }

  /**
   * Carrega todos os projetos do utilizador e armazena seus nomes num Map.
   * Este Map é usado como cache para evitar consultas repetidas ao obter o nome do projeto de cada tarefa.
   */
  private async carregarProjetos() {
    const data: Project[] = await this.projectsService.getAllProjects();

    this.nomesProjetos.clear();
    for (const p of data) {
      if (p.id != null) {
        this.nomesProjetos.set(p.id, p.name);
      }
    }
  }

  /**
   * Converte um objeto Task (do serviço) para um objeto Tarefa (usado no componente de cartões).
   * Calcula o estado da tarefa (por-fazer, feito, atrasada) e o tipo (hoje, próximas, concluídas, atrasadas).
   * Formata a data/hora limite para formato legível em português.
   * 
   * @param task - Objeto Task a converter.
   * @param todayStr - Data de hoje em formato string (YYYY-MM-DD) para comparação.
   * @returns Objeto Tarefa pronto para exibição na interface.
   */
  private mapTaskToTarefa(task: Task, todayStr: string): Tarefa {
    // Variáveis para armazenar data legível e objeto Date da deadline
    let dataLegivel = '';
    let deadline: Date | null = null;

    // Se a tarefa tem data de vencimento, formata para exibição
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

    // Determina o estado da tarefa baseado em conclusão e prazo
    let estado: 'por-fazer' | 'feito' | 'atrasada';
    if (task.completed) {
      estado = 'feito';
    } else if (deadline && deadline < now) {
      estado = 'atrasada';
    } else {
      estado = 'por-fazer';
    }

    // Determina o tipo/categoria da tarefa para filtros
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

    // Obtém o nome do projeto da tarefa a partir do cache
    const nomeProjeto =
      (task.project_id != null
        ? this.nomesProjetos.get(task.project_id)
        : undefined) || 'Sem projeto';

    return {
      id: task.id || 0,
      titulo: task.title,
      projeto: nomeProjeto,
      descricao: task.description || '',
      dataLimite: dataLegivel,
      estado,
      tipo
    };
  }

  /**
   * Carrega todas as tarefas do utilizador e converte-as para o formato de exibição.
   * Calcula a data de hoje e mapeia cada Task para Tarefa com estado e tipo apropriados.
   */
  async carregarTarefas() {
    // Calcula a data de hoje em formato YYYY-MM-DD para comparações
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const tasks: Task[] = await this.tasksService.getAllTasks();

    this.tarefas = tasks.map(t => this.mapTaskToTarefa(t, todayStr));
    console.log('Home: carregadas', this.tarefas.length, 'tarefas');
  }

  /**
   * Callback chamado quando o modal é fechado.
   * Se o modal retornar dados, recarrega os projetos e tarefas.
   * 
   * @param ev - Evento de dismiss do modal Ionic.
   */
  async onModalDismiss(ev: any) {
    this.isModalAberto = false;

    const data = ev?.detail?.data;
    if (data) {
      await this.carregarProjetos();
      await this.carregarTarefas();
    }
  }

  /**
   * Callback chamado quando o modal de nova tarefa é fechado.
   * Se uma tarefa foi criada/editada, recarrega os dados.
   * 
   * @param task - Tarefa criada/editada ou null se o modal foi cancelado.
   */
  async onNovaTarefaFechar(task: Task | null) {
    this.isModalAberto = false;

    console.log('Home: modal fechou, task?', task ? task.id : 'null');
    if (task) {
      await this.carregarProjetos();
      await this.carregarTarefas();
    }
  }

  /**
   * Navega para a página de listagem de todas as tarefas.
   */
  irPaginaTarefas() {
    this.router.navigateByUrl('/tarefas');
  }

  /**
   * Navega para a página de detalhes de uma tarefa específica.
   * Passa o parâmetro 'from' para indicar que a navegação veio da home.
   * 
   * @param tarefa - Objeto Tarefa cujos detalhes devem ser exibidos.
   */
  abrirDetalhesTarefas(tarefa: Tarefa) {
    this.router.navigate(['/detalhes-tarefas', tarefa.id], {
      queryParams: { from: 'home' }
    });
  }
}
