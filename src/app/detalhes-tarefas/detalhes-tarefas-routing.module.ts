import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetalhesTarefasPage } from './detalhes-tarefas.page';

const routes: Routes = [
  {
    path: '',
    component: DetalhesTarefasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetalhesTarefasPageRoutingModule {}
