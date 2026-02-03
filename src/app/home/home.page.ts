import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  filtro: 'hoje' | 'atrasadas' = 'hoje';

  isModalAberto = false;

  constructor(private router: Router) {}

  irPaginaTarefas() {
    this.router.navigateByUrl('/tarefas'); 
  }

}
