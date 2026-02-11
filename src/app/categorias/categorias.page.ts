import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OpcoesService } from '../services/opcoes';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';

interface Categoria {
  id: number;
  nome: string;
  icon: string;
  totalProjetos?: number;
}

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
  standalone: false
})
export class CategoriasPage implements OnInit {

  categorias: Categoria[] = [];
  categoriasOriginais: Categoria[] = []; // cópia para filtros/pesquisa

  // modal Nova/Editar categoria
  isModalCategoriaAberto = false;
  novaCategoriaNome = '';
  novaCategoriaIcon = '';
  categoriaEmEdicao: Categoria | null = null;

  constructor(
    private router: Router,
    private opcoesService: OpcoesService,
    private categoriesService: CategoriesService
  ) {}

  async ngOnInit() {
    await this.carregarCategorias();
  }

  async ionViewWillEnter() {
    await this.carregarCategorias();
  }

  private mapCategoryToCategoria(cat: Category): Categoria {
    return {
      id: cat.id ?? 0,
      nome: cat.name,
      icon: cat.icon || 'folder-open-outline',
      totalProjetos: cat.total_projects ?? 0
    };
  }

  private mapCategoriaToCategory(cat: Categoria): Category {
    return {
      id: cat.id,
      name: cat.nome,
      icon: cat.icon
      // total_projects não é guardado na BD, por isso não vai aqui
    };
  }

  async carregarCategorias() {
    const cats = await this.categoriesService.getAllCategories();
    this.categoriasOriginais = cats.map(c => this.mapCategoryToCategoria(c));
    this.categorias = [...this.categoriasOriginais];
  }

  // SEARCHBAR
  filtrarCategorias(ev: any) {
    const texto: string = (ev.detail?.value || '').toLowerCase().trim();

    if (!texto) {
      this.categorias = [...this.categoriasOriginais];
      return;
    }

    this.categorias = this.categoriasOriginais.filter(cat =>
      cat.nome.toLowerCase().includes(texto)
    );
  }

  abrirProjetos(cat: Categoria) {
    this.router.navigate(['/projetos', cat.id]);
  }

  abrirOpcoesCategoria(cat: Categoria) {
    this.opcoesService.abrirEditarEliminar(
      'categoria',
      cat.nome,
      () => {
        // EDITAR → abre o modal preenchido
        this.categoriaEmEdicao = { ...cat };
        this.novaCategoriaNome = cat.nome;
        this.novaCategoriaIcon = cat.icon;
        this.isModalCategoriaAberto = true;
      },
      async () => {
        // ELIMINAR
        await this.categoriesService.deleteCategory(cat.id);
        await this.carregarCategorias();
      }
    );
  }

  abrirFiltrosCategorias() {
    this.opcoesService.abrirFiltros(
      'categorias',
      () => {
        // ordem alfabética em cima do array atual
        this.categorias = [...this.categorias].sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );
      },
      () => {
        // repor lista original (como veio da BD)
        this.categorias = [...this.categoriasOriginais];
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

  async guardarNovaCategoria() {
    if (!this.novaCategoriaNome.trim()) {
      return;
    }

    const nome = this.novaCategoriaNome.trim();
    const icon = this.novaCategoriaIcon.trim() || 'folder-open-outline';

    if (this.categoriaEmEdicao) {
      // EDITAR
      const catAtualizada: Categoria = {
        ...this.categoriaEmEdicao,
        nome,
        icon
      };

      await this.categoriesService.updateCategory(
        this.mapCategoriaToCategory(catAtualizada)
      );
    } else {
      // NOVA
      const novaCategoria: Category = {
        name: nome,
        icon
      };

      await this.categoriesService.insertCategory(novaCategoria);
    }

    await this.carregarCategorias();
    this.fecharNovaCategoria();
  }
}
