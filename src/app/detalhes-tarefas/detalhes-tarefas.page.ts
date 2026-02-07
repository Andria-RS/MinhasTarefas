import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcoesService } from '../services/opcoes';
import { TasksService } from '../services/tasks.service';
import { Task } from '../services/task';

type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

interface DetalheTarefa {
  id: number;
  titulo: string;
  projeto: string;      // project_id em string para o select
  descricao: string;
  dataLimite: string;   // ISO completo usado no ion-datetime
  dataData: string;     // texto formatado pt-PT
  dataHora: string;     // texto HH:mm
  estado: EstadoTarefa;
  categoria: string;
  imagemUrl: string;
}

@Component({
  selector: 'app-detalhes-tarefas',
  templateUrl: './detalhes-tarefas.page.html',
  styleUrls: ['./detalhes-tarefas.page.scss'],
  standalone: false
})
export class DetalhesTarefasPage implements OnInit {

  tarefaId!: number;
  tarefa!: DetalheTarefa;

  isModalEditarAberto = false;
  tarefaEditavel!: DetalheTarefa;

  projetos = [
    { id: '1', nome: 'Estudar PMEU' },
    { id: '2', nome: 'Trabalho X' }
  ];

  categorias = [
    { id: 'escola', nome: 'escola' },
    { id: 'trabalho', nome: 'trabalho' },
    { id: 'pessoal', nome: 'pessoal' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService,
    private tasksService: TasksService
  ) {}

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('tarefaId');
    this.tarefaId = idParam ? +idParam : 0;

    if (!this.tarefaId) {
      // se não houver id válido, volta para home
      this.router.navigate(['/home']);
      return;
    }

    await this.carregarTarefa();
  }

  // --- Helpers de mapeamento entre Task (BD) e DetalheTarefa (UI) ---

  private mapTaskToDetalhe(task: Task): DetalheTarefa {
    // construir uma data ISO para o ion-datetime (data + hora)
    let isoDataLimite = '';
    let dataFormatada = '';
    let horaFormatada = '';

    if (task.due_date) {
      const base = task.due_date;                 // 'YYYY-MM-DD'
      const time = task.due_time || '00:00:00';   // 'HH:MM:SS'
      isoDataLimite = `${base}T${time}`;

      const d = new Date(isoDataLimite);
      dataFormatada = d.toLocaleDateString('pt-PT');
      horaFormatada = d.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // estado: por agora usamos 'por-fazer' / 'feito' conforme completed
    const estado: EstadoTarefa = task.completed ? 'feito' : 'por-fazer';

    return {
      id: task.id || 0,
      titulo: task.title,
      projeto: String(task.project_id),
      descricao: task.description || '',
      dataLimite: isoDataLimite,
      dataData: dataFormatada,
      dataHora: horaFormatada,
      estado,
      categoria: 'escola', // por enquanto sem BD de categorias ligada
      imagemUrl: task.image_url || 'assets/imagens/tarefas/estudar.jpg'
    };
  }

  private mapDetalheToTask(det: DetalheTarefa): Task {
    // extrair date e time separados a partir do ISO do ion-datetime
    let due_date = '';
    let due_time: string | undefined = undefined;

    if (det.dataLimite) {
      const d = new Date(det.dataLimite);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      due_date = `${yyyy}-${mm}-${dd}`;

      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      due_time = `${hh}:${mi}:00`;
    }

    const completed = det.estado === 'feito';

    return {
      id: det.id,
      project_id: Number(det.projeto),
      title: det.titulo,
      description: det.descricao,
      due_date,
      due_time,
      image_url: det.imagemUrl,
      completed
    };
  }

  // --- Carregar tarefa do Supabase ---

  async carregarTarefa() {
    const task = await this.tasksService.getTaskById(this.tarefaId);
    if (!task) {
      this.router.navigate(['/home']);
      return;
    }
    this.tarefa = this.mapTaskToDetalhe(task);
  }

  // --- Opções / Editar / Eliminar ---

  abrirOpcoesTarefa() {
    this.opcoesService.abrirEditarEliminar(
      'tarefa',
      this.tarefa.titulo,
      () => this.abrirEditarTarefa(),
      async () => {
        await this.tasksService.deleteTask(this.tarefaId);
        this.router.navigate(['/home']);
      }
    );
  }

  abrirEditarTarefa() {
    this.tarefaEditavel = { ...this.tarefa };
    this.isModalEditarAberto = true;
  }

  fecharEditarTarefa() {
    this.isModalEditarAberto = false;
  }

  async guardarEditarTarefa() {
    // atualizar campos de data/hora formatados
    if (this.tarefaEditavel.dataLimite) {
      const d = new Date(this.tarefaEditavel.dataLimite);
      this.tarefaEditavel.dataData = d.toLocaleDateString('pt-PT');
      this.tarefaEditavel.dataHora = d.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // mapear para Task e enviar para Supabase
    const taskToUpdate = this.mapDetalheToTask(this.tarefaEditavel);
    await this.tasksService.updateTask(taskToUpdate);

    // atualizar tarefa em memória e fechar modal
    this.tarefa = { ...this.tarefaEditavel };
    this.fecharEditarTarefa();
  }
}
