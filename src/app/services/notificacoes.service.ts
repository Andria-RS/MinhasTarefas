import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { construirMensagemNotificacao } from './notificacoes-text.helper';

@Injectable({ providedIn: 'root' })

/**
 * Serviço responsável pela gestão de notificações locais das tarefas.
 * Agenda e cancela notificações usando o plugin Capacitor Local Notifications.
 * Notifica o utilizador 1 dia antes e 1 hora antes do prazo de vencimento da tarefa.
 */
export class NotificacoesService {

  /**
   * Agenda notificações locais para uma tarefa específica.
   * Cria duas notificações: uma 1 dia antes e outra 1 hora antes da data limite.
   * Apenas agenda notificações se a data/hora ainda não passou.
   * 
   * @param tarefaId - ID da tarefa (usado para gerar IDs únicos das notificações).
   * @param titulo - Título da tarefa a ser exibido na notificação.
   * @param dataLimiteISO - Data e hora limite da tarefa em formato ISO string.
   */
  async agendarParaTarefa(
    tarefaId: number,
    titulo: string,
    dataLimiteISO: string
  ) {
    // Calcula a data/hora limite da tarefa
    const dataLimite = new Date(dataLimiteISO);
    const agora = new Date();

    // Calcula os momentos de notificação: 1 dia antes e 1 hora antes
    const umDiaAntes = new Date(dataLimite.getTime() - 24 * 60 * 60 * 1000);
    const umaHoraAntes = new Date(dataLimite.getTime() - 60 * 60 * 1000);

    const dueDate = dataLimite.toISOString().slice(0, 10);
    const dueTime = dataLimite.toTimeString().slice(0, 8);

    // Constrói a mensagem de corpo da notificação usando helper
    const body = construirMensagemNotificacao(titulo, dueDate, dueTime);

    // Array para armazenar as notificações a agendar
    const notifications: any[] = [];

    // Agenda notificação 1 dia antes (se ainda não passou)
    if (umDiaAntes > agora) {
      notifications.push({
        id: tarefaId * 10 + 1,
        title: titulo,
        body,
        schedule: { at: umDiaAntes, allowWhileIdle: true },
      });
    }

    // Agenda notificação 1 hora antes (se ainda não passou)
    if (umaHoraAntes > agora) {
      notifications.push({
        id: tarefaId * 10 + 2,
        title: titulo,
        body,
        schedule: { at: umaHoraAntes, allowWhileIdle: true },
      });
    }

    // Se não há notificações para agendar, retorna sem fazer nada
    if (!notifications.length) {
      return;
    }

    // Agenda todas as notificações criadas
    await LocalNotifications.schedule({ notifications });
  }

  /**
   * Cancela todas as notificações associadas a uma tarefa.
   * Remove tanto a notificação de 1 dia antes quanto a de 1 hora antes.
   * 
   * @param tarefaId - ID da tarefa cujas notificações devem ser canceladas.
   */
  async cancelarDaTarefa(tarefaId: number) {
    await LocalNotifications.cancel({
      notifications: [
        { id: tarefaId * 10 + 1 },
        { id: tarefaId * 10 + 2 },
      ],
    });
  }
}
