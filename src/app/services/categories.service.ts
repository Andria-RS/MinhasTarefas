import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';
import { Category } from './category';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  private supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = getSupabase();
  }

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
