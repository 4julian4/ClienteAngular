import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MaterialModule} from './material/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';


import { SpinnerComponent } from './componentes/spinner/spinner.component';
import { SidenavComponent } from './componentes/sidenav/sidenav.component';
import { PedirPinComponent } from './componentes/pedir-pin/pedir-pin.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MensajesUsuariosComponent } from './componentes/mensajes-usuarios/mensajes-usuarios.component';
import { AgendaComponent } from './componentes/agenda/agenda.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CitasComponent } from './componentes/citas/citas.component';
import { DetalleCitasComponent } from './componentes/detalle-citas/detalle-citas.component';
import { BuscarHitoriaClinicaComponent } from './componentes/buscar-hitoria-clinica/buscar-hitoria-clinica.component';
import { DatosPersonales } from './conexiones/rydent/modelos/datos-personales';
import { DatosPersonalesComponent } from './componentes/datos-personales/datos-personales.component';
import { Antecedentes } from './conexiones/rydent/modelos/antecedentes';  
import { MatMenuModule } from '@angular/material/menu';
import { AntecedentesComponent } from './componentes/antecedentes/antecedentes.component';
import { EvolucionComponent } from './componentes/evolucion/evolucion.component';
import { AgregarEvolucionComponent } from './componentes/agregar-evolucion/agregar-evolucion.component';




@NgModule({
  declarations: [
    AppComponent,
    SpinnerComponent,
    SidenavComponent,
    //PedirPin,
    PedirPinComponent,
    MensajesUsuariosComponent,
    AgendaComponent,
    CitasComponent,
    DetalleCitasComponent,
    BuscarHitoriaClinicaComponent,
    DatosPersonalesComponent,
    AntecedentesComponent,
    EvolucionComponent,
    AgregarEvolucionComponent
    
   
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MaterialModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatMenuModule


  ],
  
  providers: [
    DatePipe,
  ],
  bootstrap: [AppComponent],

})
export class AppModule { }
