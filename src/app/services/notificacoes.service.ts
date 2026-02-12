import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { construirMensagemNotificacao } from './notificacoes-text.helper';

@Injectable({ providedIn: 'root' })
export class NotificacoesService {

  async agendarParaTarefa(
    tarefaId: number,
    titulo: string,
    dataLimiteISO: string
  ) {
    const dataLimite = new Date(dataLimiteISO);

    const agora = new Date();

    const umDiaAntes = new Date(dataLimite.getTime() - 24 * 60 * 60 * 1000);
    const umaHoraAntes = new Date(dataLimite.getTime() - 60 * 60 * 1000);

    const dueDate = dataLimite.toISOString().slice(0, 10);
    const dueTime = dataLimite.toTimeString().slice(0, 8);

    const body = construirMensagemNotificacao(titulo, dueDate, dueTime);

    const notifications: any[] = [];

    if (umDiaAntes > agora) {
      notifications.push({
        id: tarefaId * 10 + 1,
        title: titulo,
        body,
        schedule: { at: umDiaAntes, allowWhileIdle: true },
      });
    }

    if (umaHoraAntes > agora) {
      notifications.push({
        id: tarefaId * 10 + 2,
        title: titulo,
        body,
        schedule: { at: umaHoraAntes, allowWhileIdle: true },
      });
    }

    if (!notifications.length) {
      return;
    }

    await LocalNotifications.schedule({ notifications });
  }

  async cancelarDaTarefa(tarefaId: number) {
    await LocalNotifications.cancel({
      notifications: [
        { id: tarefaId * 10 + 1 },
        { id: tarefaId * 10 + 2 },
      ],
    });
  }
}
