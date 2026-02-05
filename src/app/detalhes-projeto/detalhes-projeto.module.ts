import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DetalhesProjetoPageRoutingModule } from './detalhes-projeto-routing.module';
import { DetalhesProjetoPage } from './detalhes-projeto.page';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetalhesProjetoPageRoutingModule,
    ComponentsModule        // <- adicionas isto
  ],
  declarations: [DetalhesProjetoPage]
})
export class DetalhesProjetoPageModule {}
