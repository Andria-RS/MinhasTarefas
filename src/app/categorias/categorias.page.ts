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

  // modal Nova/Editar categoria
  isModalCategoriaAberto = false;
  novaCategoriaNome = '';
  novaCategoriaIcon = '';
  categoriaEmEdicao: Categoria | null = null;

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
        // EDITAR → abre o modal preenchido
        this.categoriaEmEdicao = cat;
        this.novaCategoriaNome = cat.nome;
        this.novaCategoriaIcon = cat.icon;
        this.isModalCategoriaAberto = true;
      },
      () => {
        // ELIMINAR (por agora só log, se quiseres mesmo apagar descomenta a linha)
        console.log('Eliminar categoria', cat);
        // this.categorias = this.categorias.filter(c => c.id !== cat.id);
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
        // aqui podias restaurar a ordem original se a guardares noutro array
        this.categorias = [...this.categorias];
      }
    );
  }

  // -------- NOVA / EDITAR CATEGORIA (sheet modal) --------

  abrirNovaCategoria() {
    this.categoriaEmEdicao = null;
    this.novaCategoriaNome = '';
    this.novaCategoriaIcon = '';
    this.isModalCategoriaAberto = true;
  }

  fecharNovaCategoria() {
    this.isModalCategoriaAberto = false;
    this.categoriaEmEdicao = null;
    this.novaCategoriaNome = '';
    this.novaCategoriaIcon = '';
  }

  guardarNovaCategoria() {
    if (!this.novaCategoriaNome.trim()) {
      return;
    }

    const nome = this.novaCategoriaNome.trim();
    const icon = this.novaCategoriaIcon.trim() || 'folder-open-outline';

    if (this.categoriaEmEdicao) {
      // EDITAR
      this.categoriaEmEdicao.nome = nome;
      this.categoriaEmEdicao.icon = icon;
    } else {
      // NOVA
      const nova: Categoria = {
        id: nome.toLowerCase().replace(/\s+/g, '-'),
        nome,
        icon,
        totalProjetos: 0
      };
      this.categorias = [...this.categorias, nova];
    }

    this.fecharNovaCategoria();
  }
}
