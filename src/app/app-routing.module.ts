import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatosPersonalesComponent } from './componentes/datos-personales/datos-personales.component';
import { Antecedentes } from './conexiones/rydent/modelos/antecedentes';
import { AntecedentesComponent } from './componentes/antecedentes/antecedentes.component';
import { EvolucionComponent } from './componentes/evolucion/evolucion.component';
import { AgendaComponent } from './componentes/agenda';

const routes: Routes = [
  {path: 'datos-personales', component: DatosPersonalesComponent},
  {path: 'antecedentes', component: AntecedentesComponent},
  {path: 'evolucion', component: EvolucionComponent},
  {path: 'agenda', component: AgendaComponent}
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
