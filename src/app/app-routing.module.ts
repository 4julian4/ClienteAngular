import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatosPersonalesComponent } from './componentes/datos-personales/datos-personales.component';
import { Antecedentes } from './conexiones/rydent/modelos/antecedentes';
import { AntecedentesComponent } from './componentes/antecedentes/antecedentes.component';
import { EvolucionComponent } from './componentes/evolucion/evolucion.component';
import { AgendaComponent } from './componentes/agenda';
import { AgregarFirmasComponent } from './componentes/agregar-firmas/agregar-firmas.component';
import { AgregarEvolucionComponent } from './componentes/agregar-evolucion/agregar-evolucion.component';
import { BuscarHitoriaClinicaComponent } from './componentes/buscar-hitoria-clinica/buscar-hitoria-clinica.component';
import { EstadoCuentaComponent } from './componentes/estado-cuenta';
import { RipsComponent } from './componentes/rips';
import { DatosAdministrativosComponent } from './componentes/datos-administrativos';

const routes: Routes = [
  {path: 'datos-personales', component: DatosPersonalesComponent},
  {path: 'antecedentes', component: AntecedentesComponent},
  {path: 'evolucion', component: EvolucionComponent},
  {path: 'agenda', component: AgendaComponent},
  {path: 'agregar-evolucion', component: AgregarEvolucionComponent},
  {path: 'agregar-firmas', component: AgregarFirmasComponent},
  {path: 'buscar-historia-clinica', component: BuscarHitoriaClinicaComponent},
  {path: 'estado-cuenta', component: EstadoCuentaComponent},
  {path: 'rips', component: RipsComponent},
  {path: 'datos-administrativos', component: DatosAdministrativosComponent}
  
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
