import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';

/**
 * Serviço responsável pela gestão de projetos.
 * Realiza operações CRUD na tabela 'projects' do Supabase.
 * Permite filtrar projetos por categoria e consultar o número de tarefas associadas.
 */
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

  /** Cliente Supabase para comunicação com a base de dados remota. */
  private supabaseClient: SupabaseClient;

  /**
   * Construtor do serviço de projetos.
   * Inicializa o cliente Supabase através da função getSupabase().
   */
  constructor() {
    this.supabaseClient = getSupabase();
  }

  /**
   * Obtém todos os projetos de uma categoria específica.
   * Inclui o número total de tarefas associadas a cada projeto.
   * @param categoryId - ID da categoria cujos projetos se pretende obter.
   * @returns Promise com array de projetos ordenados por nome.
   */
  async getProjectsByCategory(categoryId: number): Promise<Project[]> {
    const { data, error } = await this.supabaseClient
      .from('projects')
      .select(`
        id,
        name,
        description,
        category_id,
        status,
        tasks:tasks(count)
      `)
      .eq('category_id', categoryId)
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category_id: p.category_id,
      status: p.status,
      total_tasks: p.tasks?.[0]?.count ?? 0
    })) as Project[];
  }

  /**
   * Obtém um projeto específico pelo seu ID.
   * @param id - ID do projeto a pesquisar.
   * @returns Promise com o projeto encontrado ou null se não existir ou ocorrer erro.
   */
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

  /**
   * Obtém todos os projetos da base de dados.
   * Os projetos são ordenados alfabeticamente por nome.
   * @returns Promise com array de projetos ou array vazio em caso de erro.
   */
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

  /**
   * Insere um novo projeto na base de dados.
   * Se o status não for fornecido, é definido como 'por-fazer' por defeito.
   * @param project - Objeto Project com os dados do novo projeto a criar.
   * @returns Promise com o projeto criado ou null em caso de erro.
   */
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

  /**
   * Atualiza os dados de um projeto existente.
   * @param project - Objeto Project com os dados atualizados (deve conter o ID do projeto).
   * @throws Lança erro se a atualização falhar.
   */
  async updateProject(project: Project): Promise<void> {
    console.log('updateProject RECEBE', project);

    const { error } = await this.supabaseClient
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        status: project.status,
        category_id: project.category_id
      })
      .eq('id', project.id);

    if (error) {
      console.error(error);
      throw new Error('Erro ao atualizar projeto');
    }
  }

  /**
   * Elimina um projeto da base de dados.
   * @param id - ID do projeto a eliminar.
   * @throws Lança erro se a eliminação falhar.
   */
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
