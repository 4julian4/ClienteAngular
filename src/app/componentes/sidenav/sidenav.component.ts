import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SidenavService } from './';
import { environment } from 'src/environments/environment';
import { FormControl } from '@angular/forms';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UsuariosService, Usuarios } from 'src/app/conexiones/usuarios';
import { SedesService, Sedes } from 'src/app/conexiones/sedes';
import { SedesConectadas } from 'src/app/conexiones/sedes-conectadas';
import { PedirPin, PedirPinComponent } from '../pedir-pin';
import { MensajesUsuariosComponent, MensajesUsuariosService } from '../mensajes-usuarios';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from 'src/app/signalr.service';
import { ConsoleLogger } from '@microsoft/signalr/dist/esm/Utils';
import { RespuestaObtenerDoctorService } from 'src/app/conexiones/rydent/modelos/respuesta-obtener-doctor';
import { BuscarHitoriaClinicaComponent } from '../buscar-hitoria-clinica';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit, OnDestroy {
  correo: string = "";
  @Input() sedes: Sedes[] = [];
  @Input() sedesConectadas: SedesConectadas[] = [];
  idSedeActualSignalR: string = "";
  sedeSeleccionada = "";
  showFiller = false;
  titulo = environment.NombreAplicacion;
  toggleControl = new FormControl(false);
  @HostBinding('class') className = '';
  logeado = false;
  mostrarDoctores = false;
  doctorSeleccionado = "";
  doctorEscogido = "";
  totalPacientesDoctorSeleccionado = 0;
  lstDoctores: { id: number, nombre: string }[] = [];
  sedeConectadaActual: SedesConectadas = new SedesConectadas();
  private subscription: Subscription;
  public mostrarBuscarHistoriaClinica: boolean = false;




  route = "";

  constructor(
    private dialog: MatDialog,
    private location1: Location,
    private router: Router,
    public sidenavService: SidenavService,
    private overlay: OverlayContainer,
    private usuariosService: UsuariosService,
    private signalRService: SignalRService,
    private respuestaObtenerDoctorService: RespuestaObtenerDoctorService,
    private respuestaPinService: RespuestaPinService,
    private mensajesUsuariosService: MensajesUsuariosService,
    private interruptionService: InterruptionService
  ) {
    this.subscription = this.interruptionService.onInterrupt().subscribe(() => {
      this.iniciarSesion();
    });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


  cerrarSesion() {

  }
  async ngOnInit() {
    this.toggleControl.valueChanges.subscribe((darkMode) => {
      const darkClassName = 'darkMode';
      this.className = darkMode ? darkClassName : '';
      if (darkMode) {
        this.overlay.getContainerElement().classList.add(darkClassName);
      } else {
        this.overlay.getContainerElement().classList.remove(darkClassName);
      }
    });
    this.respuestaPinService.sharedNumPacientesPorDoctorData.subscribe(data => {
      if (data != null) {
        this.totalPacientesDoctorSeleccionado = data;
      }
    });

    this.respuestaPinService.setOnDoctorSeleccionadoCallback(this.onDoctorSeleccionado.bind(this));


    this.respuestaPinService.sharedcambiarDoctorSeleccionadoData.subscribe(data => {
      if (data != null) {
        console.log('sharedcambiarDoctorSeleccionadoData', data);
        this.doctorSeleccionado = this.lstDoctores.filter(x => x.nombre == data)[0].id.toString();

      }
    });



  }
  filtrarMenu(idPadre?: number): any[] {
    return [];
  }

  async iniciarSesion() {
    let resultadoConsultaUsuario = await this.usuariosService.ConsultarCorreoyFechaActivo(this.correo);
    if (resultadoConsultaUsuario.status == 1) {
      this.logeado = true;
      let usuario = await this.usuariosService.ConsultarPorCorreo(this.correo);
      if (usuario.idUsuario != undefined) {
        this.usuariosService.outUsuario.emit(usuario);
        // this.router.navigate(['/']);
      }
    }
    else {
      this.logeado = false;

    }
  }

  async pedirPinSedeSeleccionada(idSede: number) {
    if (this.sedesConectadas.length > 0 && this.sedesConectadas.filter(x => x.idSede == idSede).length > 0) {
      this.sedeConectadaActual = this.sedesConectadas.filter(x => x.idSede == idSede)[0];
      if (this.sedeConectadaActual.idSede != undefined) {
        this.idSedeActualSignalR = this.sedeConectadaActual.idActualSignalR;
        this.respuestaPinService.idSedeActualSignalREmit.emit(this.sedeConectadaActual.idActualSignalR);
        this.respuestaPinService.updateSedeData(this.sedeConectadaActual.idActualSignalR);
        let data = { clienteId: this.sedeConectadaActual.idActualSignalR, pin: '' };
        const dialogRef = this.dialog.open(PedirPinComponent, {
          data: data
        }).afterClosed().subscribe(result => {
          this.lstDoctores = result.obtenerPinRepuesta.lstDoctores;
          if (this.lstDoctores.length > 0) {
            this.mostrarDoctores = true;
            return result;
          }
        });
      }
      else {
        this.respuestaPinService.idSedeActualSignalREmit.emit("");
      }
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('La sede no esta conectada');
      this.respuestaPinService.idSedeActualSignalREmit.emit("");
      return;
    }
  }
  setMostrarBuscarHistoriaClinica(value: boolean) {
    this.mostrarBuscarHistoriaClinica = value;
  }





  async onDoctorSeleccionado(idDoctor: number) {

    // Aquí es donde haces la consulta a SignalR
    if (this.sedeConectadaActual.idSede != undefined) {

      await this.respuestaObtenerDoctorService.startConnectionRespuestaObtenerPacientesDoctorSeleccionado(this.sedeConectadaActual.idActualSignalR, idDoctor);
      this.doctorEscogido = this.lstDoctores.filter(x => x.id == idDoctor)[0].nombre;
      if (this.doctorEscogido) {
        this.respuestaPinService.updateDoctorSeleccionado(this.doctorEscogido);
      }
      //this.respuestaPinService.updateDoctorSeleccionado(this.doctorEscogido);
      this.respuestaPinService.updateCambiarDoctorSeleccionado(this.doctorEscogido);

      this.mostrarBuscarHistoriaClinica = true;

      //this.router.navigate(['/buscar-historia-clinica']);
      //this.router.navigate(['/buscar-hitoria-clinica']);

    }
  }

  async buscarPacientesDoctorSeleccionado() { }

}
