import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonItemSliding } from '@ionic/angular';

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

  constructor(private router: Router) {}

  ngOnInit() {
    this.carregarNotificacoes();
  }

  ionViewWillEnter() {
    this.carregarNotificacoes();
  }

  carregarNotificacoes() {
    // Dados mock para testar o frontend
    this.notificacoes = [
      {
        id: 1,
        tarefa_id: 1,
        titulo: 'Preparar a mala',
        mensagem: 'A tarefa "Preparar a mala" termina hoje às 17:15',
        data: '2026-02-10',
        hora: '08:00',
        lida: false
      },
      {
        id: 2,
        tarefa_id: 2,
        titulo: 'Estudar para exame',
        mensagem: 'A tarefa "Estudar para exame" termina amanhã às 12:00',
        data: '2026-02-09',
        hora: '12:00',
        lida: false
      },
      {
        id: 3,
        tarefa_id: 3,
        titulo: 'Comprar ingredientes',
        mensagem: 'A tarefa "Comprar ingredientes" termina em 2 dias às 13:00',
        data: '2026-02-08',
        hora: '13:00',
        lida: true
      }
    ];

    this.atualizarContadorNaoLidas();
  }

  atualizarContadorNaoLidas() {
    this.naoLidasCount = this.notificacoes.filter(n => !n.lida).length;
  }

  marcarComoLida(notif: Notificacao, slidingItem: IonItemSliding) {
    notif.lida = true;
    this.atualizarContadorNaoLidas();
    slidingItem.close();
    
    // TODO: Atualizar na base de dados quando integrar com Supabase
    console.log('Marcada como lida:', notif.id);
  }

  marcarTodasComoLidas() {
    this.notificacoes.forEach(n => n.lida = true);
    this.atualizarContadorNaoLidas();
    
    // TODO: Atualizar na base de dados quando integrar com Supabase
    console.log('Todas marcadas como lidas');
  }

  apagarNotificacao(notif: Notificacao, slidingItem: IonItemSliding) {
    this.notificacoes = this.notificacoes.filter(n => n.id !== notif.id);
    this.atualizarContadorNaoLidas();
    slidingItem.close();
    
    // TODO: Apagar da base de dados quando integrar com Supabase
    console.log('Notificação apagada:', notif.id);
  }

  abrirTarefa(notif: Notificacao) {
    if (!notif.lida) {
      notif.lida = true;
      this.atualizarContadorNaoLidas();
    }
    
    // Navegar para detalhes da tarefa
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
