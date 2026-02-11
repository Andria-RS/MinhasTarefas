import { Component } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {
    this.pedirPermissaoNotificacoes();
  }

  async pedirPermissaoNotificacoes() {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      console.warn('Notificações não permitidas');
    }
  }
}
