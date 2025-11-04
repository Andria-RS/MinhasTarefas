import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tarefas',
  templateUrl: './tarefas.page.html',
  styleUrls: ['./tarefas.page.scss'],
  standalone: false,
})
export class TarefasPage implements OnInit {

  public valorRecebido: any;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.valorRecebido = this.route.snapshot.paramMap.get('id');
  }
}
