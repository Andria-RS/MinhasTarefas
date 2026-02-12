import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';
import { Category } from './category';

@Injectable({
  providedIn: 'root'
})

/**
 * Serviço responsável pela gestão de categorias.
 * Realiza operações CRUD na tabela 'categories' do Supabase.
 * Permite consultar o número de projetos associados a cada categoria.
 */
export class CategoriesService {

  /** Cliente Supabase para comunicação com a base de dados remota. */
  private supabaseClient: SupabaseClient;

  /**
   * Construtor do serviço de categorias.
   * Inicializa o cliente Supabase através da função getSupabase().
   */
  constructor() {
    this.supabaseClient = getSupabase();
  }

  /**
   * Obtém todas as categorias da base de dados.
   * Inclui o número total de projetos associados a cada categoria.
   * As categorias são ordenadas alfabeticamente por nome.
   * @returns Promise com array de categorias ou array vazio em caso de erro.
   */
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await this.supabaseClient
      .from('categories')
      .select(`
        id,
        name,
        icon,
        projects:projects(count)
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      total_projects: c.projects?.[0]?.count ?? 0
    })) as Category[];
  }

  /**
   * Obtém uma categoria específica pelo seu ID.
   * @param id - ID da categoria a pesquisar.
   * @returns Promise com a categoria encontrada ou null se não existir ou ocorrer erro.
   */
  async getCategoryById(id: number): Promise<Category | null> {
    const { data, error } = await this.supabaseClient
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data as Category;
  }

  /**
   * Insere uma nova categoria na base de dados.
   * @param category - Objeto Category com os dados da nova categoria a criar.
   * @returns Promise com a categoria criada ou null em caso de erro.
   */
  async insertCategory(category: Category): Promise<Category | null> {
    const { data, error } = await this.supabaseClient
      .from('categories')
      .insert({
        name: category.name,
        icon: category.icon
      })
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data as Category;
  }

  /**
   * Atualiza os dados de uma categoria existente.
   * @param category - Objeto Category com os dados atualizados (deve conter o ID da categoria).
   * @throws Lança erro se a atualização falhar.
   */
  async updateCategory(category: Category): Promise<void> {
    const { error } = await this.supabaseClient
      .from('categories')
      .update({
        name: category.name,
        icon: category.icon
      })
      .eq('id', category.id);

    if (error) {
      console.error(error);
      throw new Error('Erro ao atualizar categoria');
    }
  }

  /**
   * Elimina uma categoria da base de dados.
   * @param id - ID da categoria a eliminar.
   * @throws Lança erro se a eliminação falhar.
   */
  async deleteCategory(id: number): Promise<void> {
    const { error } = await this.supabaseClient
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      throw new Error('Erro ao apagar categoria');
    }
  }
}
