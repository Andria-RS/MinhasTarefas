import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OpcoesService } from '../services/opcoes';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../services/category';

/**
 * Interface local que representa uma categoria para uso no componente.
 * Difere ligeiramente do modelo Category do serviço.
 */
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

/**
 * Componente da página de categorias.
 * Exibe lista de categorias com possibilidade de criar, editar, eliminar e filtrar.
 * Permite navegar para a página de projetos de cada categoria.
 * Implementa OnInit para inicialização de formulários e carregamento de dados.
 */
export class CategoriasPage implements OnInit {

  /** Lista de categorias exibidas atualmente (pode estar filtrada). */
  categorias: Categoria[] = [];
  
  /** Lista completa de categorias sem filtros aplicados. */
  categoriasOriginais: Categoria[] = [];
  
  /** Indica se o modal de nova/editar categoria está aberto. */
  isModalCategoriaAberto = false;
  
  /** Categoria em modo de edição, ou null se estiver a criar uma nova. */
  categoriaEmEdicao: Categoria | null = null;
  
  /** Formulário reativo para criar/editar categoria. */
  formCategoria!: FormGroup;

  /**
   * Construtor da página de categorias.
   * Injeta dependências de routing, serviços e FormBuilder para formulários reativos.
   */
  constructor(
    private router: Router,
    private opcoesService: OpcoesService,
    private categoriesService: CategoriesService,
    private fb: FormBuilder
  ) {}

  /**
   * Método do ciclo de vida Angular chamado na inicialização do componente.
   * Configura o formulário reativo com validadores e carrega as categorias.
   */
  async ngOnInit() {
    this.formCategoria = this.fb.group({
      nome: ['', Validators.required],
      icon: ['', Validators.required]
    });

    await this.carregarCategorias();
  }

  /**
   * Método do ciclo de vida Ionic chamado antes da página entrar na view.
   * Recarrega as categorias para garantir dados atualizados.
   */
  async ionViewWillEnter() {
    await this.carregarCategorias();
  }

  /** Converte um objeto Category (do serviço) para Categoria (interface local do componente). */
  private mapCategoryToCategoria(cat: Category): Categoria {
    return {
      id: cat.id ?? 0,
      nome: cat.name,
      icon: cat.icon || 'folder-open-outline',
      totalProjetos: cat.total_projects ?? 0
    };
  }

  /** Converte um objeto Categoria (interface local) para Category (do serviço). */
  private mapCategoriaToCategory(cat: Categoria): Category {
    return {
      id: cat.id,
      name: cat.nome,
      icon: cat.icon
    };
  }

  /** Carrega todas as categorias do serviço e atualiza as listas local e original. */
  async carregarCategorias() {
    const cats = await this.categoriesService.getAllCategories();
    this.categoriasOriginais = cats.map(c => this.mapCategoryToCategoria(c));
    this.categorias = [...this.categoriasOriginais];
  }

  /**
   * Filtra as categorias exibidas com base no texto de pesquisa.
   * Se o texto estiver vazio, exibe todas as categorias.
   */
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

  /** Navega para a página de projetos filtrada pela categoria selecionada. */
  abrirProjetos(cat: Categoria) {
    this.router.navigate(['/projetos', cat.id]);
  }

   /** Abre o menu de opções (editar/eliminar) para uma categoria. */
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

  /** Abre o menu de filtros para ordenar ou resetar a lista de categorias. */
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

  /** Abre o modal para criar uma nova categoria. */
  abrirNovaCategoria() {
    this.categoriaEmEdicao = null;
    this.formCategoria.reset({
      nome: '',
      icon: ''
    });
    this.isModalCategoriaAberto = true;
  }

  /** Fecha o modal de nova/editar categoria e limpa o formulário. */
  fecharNovaCategoria() {
    this.isModalCategoriaAberto = false;
    this.categoriaEmEdicao = null;
    this.formCategoria.reset();
  }

  /** Guarda uma categoria (nova ou editada) na base de dados. */
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
