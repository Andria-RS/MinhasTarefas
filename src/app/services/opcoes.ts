import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';

type TipoEntidade = 'categoria' | 'projeto' | 'tarefa';
type TipoFiltro = 'categorias' | 'projetos';

@Injectable({ providedIn: 'root' })
export class OpcoesService {
  constructor(private actionSheetCtrl: ActionSheetController) {}

  async abrirEditarEliminar(
    tipo: TipoEntidade,
    nome: string,
    onEditar: () => void,
    onEliminar: () => void
  ) {
    const sheet = await this.actionSheetCtrl.create({
      header: nome,
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: onEditar
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash-outline',
          handler: onEliminar
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });

    await sheet.present();
  }

  async abrirFiltros(
    tipo: TipoFiltro,
    onAlfabetica: () => void,
    onCriacao: () => void
  ) {
    const titulo =
      tipo === 'projetos' ? 'Ordenar projetos' : 'Ordenar categorias';

    const sheet = await this.actionSheetCtrl.create({
      header: titulo,
      buttons: [
        {
          text: 'Ordem alfabética',
          icon: 'text-outline',
          handler: onAlfabetica
        },
        {
          text: 'Ordem de criação',
          icon: 'time-outline',
          handler: onCriacao
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });

    await sheet.present();
  }
}
