import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';

type EstadoProjeto = 'por-fazer' | 'feito';

interface Projeto {
  id: string;
  nome: string;
  imagem: string;
  totalTarefas: number;
  estado: EstadoProjeto;
}

@Component({
  selector: 'app-projetos',
  templateUrl: './projetos.page.html',
  styleUrls: ['./projetos.page.scss'],
  standalone: false
})
export class ProjetosPage implements OnInit {
  categoriaId!: string;
  titulo = 'Projetos';

  projetos: Projeto[] = [
    {
      id: 'p1',
      nome: 'Estudar PMEU',
      imagem: 'assets/img/projeto_estudar.png',
      totalTarefas: 5,
      estado: 'por-fazer',
    },
    {
      id: 'p2',
      nome: 'Trabalho de BD',
      imagem: 'assets/img/projeto_bd.png',
      totalTarefas: 8,
      estado: 'feito',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actionSheetCtrl: ActionSheetController
  ) {}

  ngOnInit() {
    this.categoriaId = this.route.snapshot.paramMap.get('categoriaId') || '';

    const nomesCategorias: Record<string, string> = {
      escola: 'Escola',
      trabalho: 'Trabalho',
      casa: 'Casa'
    };

    if (this.categoriaId) {
      const legivel = nomesCategorias[this.categoriaId] || this.categoriaId;
      this.titulo = `Projetos de ${legivel}`;
      // aqui no futuro filtras this.projetos pela categoriaId
    } else {
      this.titulo = 'Projetos';
    }
  }

  abrirDetalhe(projeto: Projeto) {
    this.router.navigate(['/detalhe-projeto', projeto.id]);
  }

  async abrirOpcoesProjeto(projeto: Projeto) {
    const sheet = await this.actionSheetCtrl.create({
      header: projeto.nome,
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => {
            console.log('Editar projeto', projeto);
            // TODO: abrir modal / página de edição
          }
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => {
            console.log('Eliminar projeto', projeto);
            // TODO: remover do array/backend
          }
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
