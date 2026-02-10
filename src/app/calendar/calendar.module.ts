import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CalendarPageRoutingModule } from './calendar-routing.module';
import { CalendarPage } from './calendar.page';
import { ComponentsModule } from '../components/components.module'; // ← Importa o módulo

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CalendarPageRoutingModule,
    ComponentsModule  // ← Adiciona aqui (não o componente diretamente)
  ],
  declarations: [CalendarPage]
})
export class CalendarPageModule {}
