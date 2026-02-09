import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';

export interface Project {
  id?: number;
  name: string;
  description?: string;
  category_id: number;
  status?: 'por-fazer' | 'feito';
  total_tasks?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = getSupabase();
  }

  async getProjectsByCategory(categoryId: number): Promise<Project[]> {
    const { data, error } = await this.supabaseClient
      .from('projects')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }

    return data as Project[];
  }

  async getProjectById(id: number): Promise<Project | null> {
    const { data, error } = await this.supabaseClient
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data as Project;
  }

  async getAllProjects(): Promise<Project[]> {
    const { data, error } = await this.supabaseClient
      .from('projects')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }

    return data as Project[];
  }


  async insertProject(project: Project): Promise<Project | null> {
    const { data, error } = await this.supabaseClient
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        category_id: project.category_id,
        status: project.status ?? 'por-fazer'
      })
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data as Project;
  }

  async updateProject(project: Project): Promise<void> {
    console.log('updateProject RECEBE', project);

    const { error } = await this.supabaseClient
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        status: project.status,
        category_id: project.category_id   // <-- linha que faltava
      })
      .eq('id', project.id);

    if (error) {
      console.error(error);
      throw new Error('Erro ao atualizar projeto');
    }
  }


  async deleteProject(id: number): Promise<void> {
    const { error } = await this.supabaseClient
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      throw new Error('Erro ao apagar projeto');
    }
  }
}
