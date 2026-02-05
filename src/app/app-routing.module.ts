import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'listas',
    loadChildren: () =>
      import('./listas/listas.module').then(m => m.ListasPageModule)
  },
  {
    path: 'tarefas/:id',
    loadChildren: () =>
      import('./tarefas/tarefas.module').then(m => m.TarefasPageModule)
  },
  {
    path: 'projetos',
    loadChildren: () =>
      import('./projetos/projetos.module').then(m => m.ProjetosPageModule)
  },
  {
    path: 'projetos/:categoriaId',
    loadChildren: () =>
      import('./projetos/projetos.module').then(m => m.ProjetosPageModule)
  },
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
