import { Component, OnInit, Input } from '@angular/core';
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

  toDo = [
    {id: 1, titulo: "Estudar Angular", descricao:"Aulas"},
  ];

  inProgress = [
    {id: 2, titulo: "Trabalho de Programação Móvel", descricao: "Projetos"},
  ];

  done = [
    {id: 3, titulo: "Lanche de curso", descricao: "Pessoais"}
  ];


  
}
