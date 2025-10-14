import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listas',
  templateUrl: './listas.page.html',
  styleUrls: ['./listas.page.scss'],
  standalone: false,
})
export class ListasPage implements OnInit {

  constructor(private router: Router) { }
  
  irPaginaTarefas() {
    this.router.navigateByUrl('/tarefas'); 
  }

  ngOnInit() {
  }

}
