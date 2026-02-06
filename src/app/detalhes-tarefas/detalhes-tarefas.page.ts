import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OpcoesService } from '../services/opcoes';

type EstadoTarefa = 'por-fazer' | 'feito' | 'atrasada';

interface DetalheTarefa {
  id: number;
  titulo: string;
  projeto: string;
  descricao: string;
  dataLimite: string;
  dataData: string;
  dataHora: string;
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opcoesService: OpcoesService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('tarefaId');
    this.tarefaId = idParam ? +idParam : 0;

    // MOCK por agora (depois vens buscar do teu service de tarefas)
    const data = new Date('2026-02-10T18:00:00');

    this.tarefa = {
      id: this.tarefaId,
      titulo: 'Ler apontamentos',
      projeto: 'Estudar PMEU',
      descricao: 'Capítulos 1 a 3, fazer resumo, rever slides.',
      dataLimite: data.toISOString(),
      dataData: data.toLocaleDateString('pt-PT'),
      dataHora: data.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      estado: 'por-fazer',
      categoria: 'Escola',
      imagemUrl: 'assets/imagens/tarefas/estudar.jpg'
    };
  }

  abrirOpcoesTarefa() {
    this.opcoesService.abrirEditarEliminar(
      'tarefa',
      this.tarefa.titulo,
      () => {
        // EDITAR → por agora podemos navegar para uma página de edição
        this.router.navigate(['/editar-tarefa', this.tarefaId]);
      },
      () => {
        // ELIMINAR → depois ligas ao teu serviço de tarefas
        console.log('Eliminar tarefa', this.tarefaId);
        this.router.navigate(['/home']);
      }
    );
  }
}
