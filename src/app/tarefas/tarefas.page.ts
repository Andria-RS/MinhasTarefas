import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Camera, CameraResultType } from '@capacitor/camera';


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

  public photo: string | undefined;

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri
      });

      if (image.webPath) {
        this.photo = image.webPath;
      } else {
        console.warn('Nenhuma foto foi capturada.');
      }

    } catch (error) {
    console.error('Erro ao tirar foto:', error);
    }
  }

  public tarefa = {
    title: '',
    description: '',
  };

  onSubmit(form: any) {
    if (form.valid) {
      console.log('Tarefa salva:', this.tarefa);
    } else {
      console.warn('Form inválido');
    }
  }
}
