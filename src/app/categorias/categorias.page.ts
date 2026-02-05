import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';

interface Categoria {
  id: string;
  nome: string;
  icon: string;
  totalProjetos: number;
}

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
  standalone: false
})
export class CategoriasPage implements OnInit {

  categorias: Categoria[] = [
    { id: 'escola',   nome: 'Escola',   icon: 'school-outline',    totalProjetos: 3 },
    { id: 'trabalho', nome: 'Trabalho', icon: 'briefcase-outline', totalProjetos: 2 },
  ];

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private router: Router
  ) {}

  ngOnInit() {}

  abrirProjetos(cat: Categoria) {
    this.router.navigate(['/projetos', cat.id]);
  }

  async abrirOpcoesCategoria(cat: Categoria) {
    const sheet = await this.actionSheetCtrl.create({
      header: cat.nome,
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => {
            console.log('Editar', cat);
          }
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => {
            console.log('Eliminar', cat);
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
