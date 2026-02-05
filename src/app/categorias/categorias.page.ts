import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OpcoesService } from '../services/opcoes';

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
    private router: Router,
    private opcoesService: OpcoesService
  ) {}

  ngOnInit() {}

  abrirProjetos(cat: Categoria) {
    this.router.navigate(['/projetos', cat.id]);
  }

  abrirOpcoesCategoria(cat: Categoria) {
    this.opcoesService.abrirEditarEliminar(
      'categoria',
      cat.nome,
      () => {
        console.log('Editar categoria', cat);
      },
      () => {
        console.log('Eliminar categoria', cat);
      }
    );
  }

  abrirFiltrosCategorias() {
    this.opcoesService.abrirFiltros(
      'categorias',
      () => {
        // ordem alfabética
        this.categorias = [...this.categorias].sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );
      },
      () => {
        // ordem de criação (assumindo que o array já está na ordem de criação)
        this.categorias = [...this.categorias]; // aqui podias voltar ao original se o guardares noutro array
      }
    );
  }
}
