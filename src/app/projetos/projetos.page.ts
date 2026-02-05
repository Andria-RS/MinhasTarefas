import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
    private router: Router
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
    this.router.navigate(['/projeto', projeto.id]);
  }

  abrirOpcoesProjeto(projeto: Projeto) {
    console.log('Opções para projeto', projeto);
  }
}
