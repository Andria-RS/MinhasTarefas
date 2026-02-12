import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  categoriasOriginais: Categoria[] = [];

  isModalCategoriaAberto = false;
  categoriaEmEdicao: Categoria | null = null;

  formCategoria!: FormGroup;

  constructor(
    private router: Router,
    private opcoesService: OpcoesService,
    private categoriesService: CategoriesService,
    private fb: FormBuilder
  ) {}

  async ngOnInit() {
    this.formCategoria = this.fb.group({
      nome: ['', Validators.required],
      icon: ['', Validators.required]
    });

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
    };
  }

  async carregarCategorias() {
    const cats = await this.categoriesService.getAllCategories();
    this.categoriasOriginais = cats.map(c => this.mapCategoryToCategoria(c));
    this.categorias = [...this.categoriasOriginais];
  }

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
        this.categoriaEmEdicao = { ...cat };
        this.isModalCategoriaAberto = true;
        this.formCategoria.setValue({
          nome: cat.nome,
          icon: cat.icon
        });
      },
      async () => {
        await this.categoriesService.deleteCategory(cat.id);
        await this.carregarCategorias();
      }
    );
  }

  abrirFiltrosCategorias() {
    this.opcoesService.abrirFiltros(
      'categorias',
      () => {
        this.categorias = [...this.categorias].sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );
      },
      () => {
        this.categorias = [...this.categoriasOriginais];
      }
    );
  }

  abrirNovaCategoria() {
    this.categoriaEmEdicao = null;
    this.formCategoria.reset({
      nome: '',
      icon: ''
    });
    this.isModalCategoriaAberto = true;
  }

  fecharNovaCategoria() {
    this.isModalCategoriaAberto = false;
    this.categoriaEmEdicao = null;
    this.formCategoria.reset();
  }

  async guardarNovaCategoria() {
    if (this.formCategoria.invalid) {
      this.formCategoria.markAllAsTouched();
      return;
    }

    const nome = this.formCategoria.value.nome.trim();
    const icon = this.formCategoria.value.icon.trim() || 'folder-open-outline';

    if (this.categoriaEmEdicao) {
      const catAtualizada: Categoria = {
        ...this.categoriaEmEdicao,
        nome,
        icon
      };

      await this.categoriesService.updateCategory(
        this.mapCategoriaToCategory(catAtualizada)
      );
    } else {
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
