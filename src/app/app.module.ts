import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MaterialModule} from './material/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

import { LoginComponent } from './componentes/login/login.component';
import { SpinnerComponent } from './componentes/spinner/spinner.component';
import { httpLoadingInterceptorInterceptor } from './componentes/spinner/http-loading-interceptor.interceptor';
import { SidenavComponent } from './componentes/sidenav/sidenav.component';
import { PedirPinComponent } from './componentes/pedir-pin/pedir-pin.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MensajesUsuariosComponent } from './componentes/mensajes-usuarios/mensajes-usuarios.component';
import { AgendaComponent } from './componentes/agenda/agenda.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
import { AgregarFirmasComponent } from './componentes/agregar-firmas/agregar-firmas.component';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { NativeDateAdapter } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { EstadoCuentaComponent } from './componentes/estado-cuenta/estado-cuenta.component';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar'; //
 
import {RipsComponent} from './componentes/rips/rips.component';
import { DatosAdministrativos, DatosAdministrativosComponent } from './componentes/datos-administrativos';
import { HideColumnDirective } from './directives/hide-column.directive';

//-----------------Formato de fecha-------------------
export const MY_DATE_FORMATS = {
  parse: {
      dateInput: 'DD/MM/YYYY',
  },
  display: {
      dateInput: 'DD/MM/YYYY',
      monthYearLabel: 'MMM YYYY',
      dateA11yLabel: 'LL',
      monthYearA11yLabel: 'MMMM YYYY',
  },
};


@NgModule({ declarations: [
        AppComponent,
        LoginComponent,
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
        AgregarEvolucionComponent,
        AgregarFirmasComponent,
        EstadoCuentaComponent,
        RipsComponent,
        DatosAdministrativosComponent,
        HideColumnDirective
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        BrowserAnimationsModule,
        MaterialModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatTabsModule,
        MatMenuModule,
        MatIconModule,
        MatProgressBarModule,
        NgxMaterialTimepickerModule,
        MatAutocompleteModule,
        MatCardModule], providers: [
        DatePipe,
        { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
        { provide: DateAdapter, useClass: NativeDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: HTTP_INTERCEPTORS, useClass: httpLoadingInterceptorInterceptor, multi: true },
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
