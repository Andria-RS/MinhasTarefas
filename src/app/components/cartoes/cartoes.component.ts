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

  ngOnInit() {}


  @Input() titulo = '';
  @Input() tasks: { id: number; titulo: string; descricao: string }[] = [];

}
