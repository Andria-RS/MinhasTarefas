import { Component, OnInit, Input} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cartoes',
  templateUrl: './cartoes.component.html',
  styleUrls: ['./cartoes.component.scss'],
  standalone: false,
})
export class CartoesComponent  implements OnInit {

  constructor(private router: Router) { }

  irPaginaTarefas(item: any) {
    this.router.navigateByUrl(`/tarefas/${item.id}`); 
  }

  eliminarTarefa(id: number) {
  this.tasks = this.tasks.filter(item => item.id !== id);
  }

  reordenacao(event: any) {
    const movedItem = this.tasks.splice(event.detail.from, 1)[0];

    this.tasks.splice(event.detail.to, 0, movedItem);

    event.detail.complete();
  }

  ngOnInit() {}


  @Input() titulo = '';
  @Input() tasks: { id: number; titulo: string; descricao: string }[] = [];

}
