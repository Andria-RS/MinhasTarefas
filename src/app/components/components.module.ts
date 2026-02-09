import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { NovaTarefaComponent } from './nova-tarefa/nova-tarefa.component';
import { CartoesTarefasComponent } from './cartoes-tarefas/cartoes-tarefas.component';

@NgModule({
  declarations: [
    NovaTarefaComponent,
    CartoesTarefasComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule        // <-- adicionar aqui
  ],
  exports: [
    NovaTarefaComponent,
    CartoesTarefasComponent
  ]
})
export class ComponentsModule {}
