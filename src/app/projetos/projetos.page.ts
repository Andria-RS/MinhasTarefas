import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projetos',
  templateUrl: './projetos.page.html',
  styleUrls: ['./projetos.page.scss'],
  standalone: false
})
export class ProjetosPage implements OnInit {

  constructor(private router: Router) {}

  irPaginaListas() {
    this.router.navigateByUrl('/listas');
  }

  ngOnInit() {
  }

}
