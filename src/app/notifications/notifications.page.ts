import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonItemSliding } from '@ionic/angular';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';
import { getSupabase } from '../services/supabase.client';

/**
 * Interface que representa uma notificação da aplicação.
 * Contém informações sobre a tarefa associada, mensagem e estado de leitura.
 */
interface Notificacao {
  /** Identificador único da notificação. */
  id: number;
  
  /** ID da tarefa associada à notificação. */
  tarefa_id: number;
  
  /** Título da notificação (normalmente o título da tarefa). */
  titulo: string;
  
  /** Mensagem descritiva da notificação. */
  mensagem: string;
  
  /** Data da notificação no formato string. */
  data: string;
  
  /** Hora da notificação no formato string. */
  hora: string;
  
  /** Indica se a notificação foi lida pelo utilizador. */
  lida: boolean;
}

/**
 * Componente da página de notificações.
 * Exibe todas as notificações das tarefas, permitindo marcá-las como lidas ou apagá-las.
 * Sincroniza o estado das notificações com a base de dados Supabase.
 * Permite navegar para os detalhes da tarefa associada a cada notificação.
 */
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: false
})
export class NotificationsPage implements OnInit {
  
  /** Lista de todas as notificações carregadas da base de dados. */
  notificacoes: Notificacao[] = [];
  
  /** Contador de notificações não lidas (para badge). */
  naoLidasCount: number = 0;

  /**
   * Construtor da página de notificações.
   * Injeta dependências de routing e serviço de tarefas.
   * 
   * @param router - Serviço de roteamento Angular.
   * @param tasksService - Serviço para gestão de tarefas.
   */
  constructor(
    private router: Router,
    private tasksService: TasksService,
  ) {}

  /**
   * Método do ciclo de vida Angular chamado na inicialização do componente.
   * Carrega todas as notificações da base de dados.
   */
  ngOnInit() {
    this.carregarNotificacoes();
  }

  /**
   * Método do ciclo de vida Ionic chamado antes da página entrar na view.
   * Recarrega as notificações para garantir dados atualizados.
   */
  ionViewWillEnter() {
    this.carregarNotificacoes();
  }

  /**
   * Carrega todas as notificações da tabela 'notifications' do Supabase.
   * Ordena por data de criação (mais recentes primeiro) e atualiza o contador de não lidas.
   */
  async carregarNotificacoes() {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro a carregar notificações', error);
      this.notificacoes = [];
    } else {
      this.notificacoes = (data || []).map((n: any) => ({
        id: n.id,
        tarefa_id: n.tarefa_id,
        titulo: n.titulo,
        mensagem: n.mensagem,
        data: n.created_at.slice(0, 10),
        hora: n.created_at.slice(11, 16),
        lida: n.lida,
      }));
    }

    this.atualizarContadorNaoLidas();
  }

  /**
   * Atualiza o contador de notificações não lidas.
   * Conta quantas notificações têm o campo 'lida' como false.
   */
  atualizarContadorNaoLidas() {
    this.naoLidasCount = this.notificacoes.filter(n => !n.lida).length;
  }

  /**
   * Marca uma notificação específica como lida.
   * Atualiza o estado localmente e sincroniza com a base de dados.
   * 
   * @param notif - Notificação a marcar como lida.
   * @param slidingItem - Componente de sliding do Ionic (para fechar após ação).
   */
  async marcarComoLida(notif: Notificacao, slidingItem: IonItemSliding) {
    notif.lida = true;
    this.atualizarContadorNaoLidas();
    slidingItem.close();

    const supabase = getSupabase();
    await supabase
      .from('notifications')
      .update({ lida: true })
      .eq('id', notif.id);
  }

  /**
   * Marca todas as notificações como lidas.
   * Atualiza o estado local de todas as notificações e sincroniza com a base de dados.
   */
  async marcarTodasComoLidas() {
    this.notificacoes.forEach(n => n.lida = true);
    this.atualizarContadorNaoLidas();

    const ids = this.notificacoes.map(n => n.id);
    if (ids.length) {
      const supabase = getSupabase();
      await supabase
        .from('notifications')
        .update({ lida: true })
        .in('id', ids);
    }
  }

  /**
   * Apaga uma notificação específica.
   * Remove da lista local e elimina da base de dados.
   * 
   * @param notif - Notificação a apagar.
   * @param slidingItem - Componente de sliding do Ionic (para fechar após ação).
   */
  async apagarNotificacao(notif: Notificacao, slidingItem: IonItemSliding) {
    this.notificacoes = this.notificacoes.filter(n => n.id !== notif.id);
    this.atualizarContadorNaoLidas();
    slidingItem.close();

    const supabase = getSupabase();
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notif.id);
  }

  /**
   * Navega para a página de detalhes da tarefa associada à notificação.
   * Se a notificação ainda não foi lida, marca-a como lida automaticamente.
   * 
   * @param notif - Notificação cuja tarefa deve ser aberta.
   */
  abrirTarefa(notif: Notificacao) {
    if (!notif.lida) {
      notif.lida = true;
      this.atualizarContadorNaoLidas();
    }

    this.router.navigate(['/tabs/home/detalhes-tarefa', notif.tarefa_id]);
  }

  /**
   * Formata uma data para exibição amigável.
   * Retorna "Hoje", "Ontem" ou a data formatada (ex: "12 fev").
   * 
   * @param dataString - Data no formato string (YYYY-MM-DD).
   * @returns String formatada da data.
   */
  formatarData(dataString: string): string {
    const data = new Date(dataString + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    data.setHours(0, 0, 0, 0);

    if (data.getTime() === hoje.getTime()) {
      return 'Hoje';
    } else if (data.getTime() === ontem.getTime()) {
      return 'Ontem';
    } else {
      const dia = data.getDate().toString().padStart(2, '0');
      const mes = data.toLocaleDateString('pt-PT', { month: 'short' });
      return `${dia} ${mes}`;
    }
  }
}
