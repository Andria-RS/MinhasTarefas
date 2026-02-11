import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonItemSliding } from '@ionic/angular';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';
import { getSupabase } from '../services/supabase.client';


interface Notificacao {
  id: number;
  tarefa_id: number;
  titulo: string;
  mensagem: string;
  data: string;
  hora: string;
  lida: boolean;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: false
})
export class NotificationsPage implements OnInit {
  notificacoes: Notificacao[] = [];
  naoLidasCount: number = 0;

  constructor(
    private router: Router,
    private tasksService: TasksService, // ✅ NOVO
  ) {}

  ngOnInit() {
    this.carregarNotificacoes();
  }

  ionViewWillEnter() {
    this.carregarNotificacoes();
  }

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
        data: n.data,
        hora: n.hora.slice(0, 5),
        lida: n.lida,
      }));
    }

    this.atualizarContadorNaoLidas();
  }



  atualizarContadorNaoLidas() {
    this.naoLidasCount = this.notificacoes.filter(n => !n.lida).length;
  }

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



  abrirTarefa(notif: Notificacao) {
    if (!notif.lida) {
      notif.lida = true;
      this.atualizarContadorNaoLidas();
    }

    this.router.navigate(['/tabs/home/detalhes-tarefa', notif.tarefa_id]);
  }

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
