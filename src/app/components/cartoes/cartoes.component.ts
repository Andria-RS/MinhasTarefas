import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cartoes',
  templateUrl: './cartoes.component.html',
  styleUrls: ['./cartoes.component.scss'],
  standalone: false,
})
export class CartoesComponent  implements OnInit {

  constructor(private router: Router) { }

  irPaginaTarefas() {
    this.router.navigateByUrl('/tarefas'); 
  }

  ngOnInit() {}

}
