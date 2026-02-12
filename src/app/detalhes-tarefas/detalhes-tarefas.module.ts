import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DetalhesTarefasPageRoutingModule } from './detalhes-tarefas-routing.module';
import { DetalhesTarefasPage } from './detalhes-tarefas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetalhesTarefasPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [DetalhesTarefasPage]
})
export class DetalhesTarefasPageModule {}
