import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetalhesProjetoPage } from './detalhes-projeto.page';

const routes: Routes = [
  {
    path: '',
    component: DetalhesProjetoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetalhesProjetoPageRoutingModule {}
