import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
  standalone: false
})
export class CategoriasPage implements OnInit {

  constructor(private actionSheetCtrl: ActionSheetController) { }

  ngOnInit() { }

  async abrirOpcoesCategoria() {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Categoria',
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => {
            // mais tarde: lógica de editar
          }
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => {
            // mais tarde: lógica de eliminar
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await sheet.present();
  }

}
