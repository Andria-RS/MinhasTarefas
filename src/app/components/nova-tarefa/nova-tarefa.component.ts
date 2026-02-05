import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-nova-tarefa',
  templateUrl: './nova-tarefa.component.html',
  styleUrls: ['./nova-tarefa.component.scss'],
  standalone: false
})
export class NovaTarefaComponent implements OnInit {
  @Input() categoria?: any;
  @Input() projeto?: any;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  fechar() {
    this.modalCtrl.dismiss();
  }
}
