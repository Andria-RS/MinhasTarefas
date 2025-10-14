import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  constructor(private router: Router) {}

  irPaginaListas() {
    this.router.navigateByUrl('/listas');
  }

  irPaginaTarefas() {
    this.router.navigateByUrl('/tarefas'); 
  }

}
