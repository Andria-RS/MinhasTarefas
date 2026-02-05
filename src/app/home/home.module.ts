import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';

import { NovaTarefaComponent } from '../components/nova-tarefa/nova-tarefa.component';
import { CartoesTarefasComponent } from '../components/cartoes-tarefas/cartoes-tarefas.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule
  ],
  declarations: [
    HomePage,
    NovaTarefaComponent,
    CartoesTarefasComponent 
  ]
})
export class HomePageModule {}
