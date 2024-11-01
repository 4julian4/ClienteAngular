import { Component, EventEmitter, HostBinding, HostListener, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { SidenavService } from './';
import { environment } from 'src/environments/environment';
import { FormControl } from '@angular/forms';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UsuariosService, Usuarios } from 'src/app/conexiones/usuarios';
import { SedesService, Sedes } from 'src/app/conexiones/sedes';
import { SedesConectadas, SedesConectadasService } from 'src/app/conexiones/sedes-conectadas';
import { PedirPin, PedirPinComponent } from '../pedir-pin';
import { MensajesUsuariosComponent, MensajesUsuariosService } from '../mensajes-usuarios';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from 'src/app/signalr.service';
import { ConsoleLogger } from '@microsoft/signalr/dist/esm/Utils';
import { RespuestaObtenerDoctorService } from 'src/app/conexiones/rydent/modelos/respuesta-obtener-doctor';
import { BuscarHitoriaClinicaComponent } from '../buscar-hitoria-clinica';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { LoginService } from '../login';
import { MatIconModule } from '@angular/material/icon';
import { HttpHeaders } from '@angular/common/http';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';



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
  //sedeSeleccionada = "";
  showFiller = false;
  //titulo = environment.NombreAplicacion;
  titulo = "Rydent Web";
  toggleControl = new FormControl(false);
  @HostBinding('class') className = '';
  logeado = false;
  mostrarDoctores = false;
  mostrarSedes = true;
  mostrarCerrarSesion = true;
  mostrarTitulo = true;
  emailUsuario = "";
  doctorSeleccionado = "";
  doctorEscogido = "";
  idPacienteSeleccionado = 0;
  totalPacientesDoctorSeleccionado = 0;
  lstDoctores: { id: number, nombre: string }[] = [];
  sedeConectadaActual: SedesConectadas = new SedesConectadas();
  sedeSeleccionada: SedesConectadas = new SedesConectadas();
  sedesConectadasActualizadas: SedesConectadas[] = [];
  private subscription: Subscription;
  public mostrarBuscarHistoriaClinica: boolean = false;
  menuExpandido = false;
  menuOpen = false;
  route = "";
  usuarioActual: Usuarios = new Usuarios();

  constructor(
    private renderer: Renderer2,
    private dialog: MatDialog,
    private location1: Location,
    private router: Router,
    public sidenavService: SidenavService,
    private overlay: OverlayContainer,
    private usuariosService: UsuariosService,
    private signalRService: SignalRService,
    private loginService: LoginService,
    private respuestaObtenerDoctorService: RespuestaObtenerDoctorService,
    private respuestaPinService: RespuestaPinService,
    private mensajesUsuariosService: MensajesUsuariosService,
    private interruptionService: InterruptionService,
    private sedesConectadasService: SedesConectadasService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.subscription = this.interruptionService.onInterrupt().subscribe(() => {
      this.iniciarSesion();
    });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleClick() {
    this.setMostrarBuscarHistoriaClinica(false);

    if (window.innerWidth <= 768) { // Ajusta el tamaño según tus necesidades
      this.router.navigate(['/agenda-responsive']);
    } else {
      this.router.navigate(['/agenda']);
    }
  }

  cerrarSesion() {

  }
  async ngOnInit() {
    console.log('sidenav');
    this.mostrarTitulo = true;
    this.renderer.setAttribute(document.body, 'id', 'body');

    this.toggleControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((darkMode) => {
      const darkClassName = 'darkMode';
      this.className = darkMode ? darkClassName : '';
      if (darkMode) {
        this.overlay.getContainerElement().classList.add(darkClassName);
      } else {
        this.overlay.getContainerElement().classList.remove(darkClassName);
      }
    });
    this.respuestaPinService.sharedNumPacientesPorDoctorData.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data != null) {
        this.totalPacientesDoctorSeleccionado = data;
      }
    });

    this.usuariosService.outUsuario.pipe(takeUntil(this.destroy$)).subscribe(async (value: Usuarios) => {
      this.usuarioActual = value;
    });

    this.respuestaPinService.setOnDoctorSeleccionadoCallback(this.onDoctorSeleccionado.bind(this));

    this.respuestaPinService.sharedAnamnesisData.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data != null) {
        this.idPacienteSeleccionado = data;
      }
    });

    this.respuestaPinService.sharedcambiarDoctorSeleccionadoData.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data != null) {
        console.log('sharedcambiarDoctorSeleccionadoData', data);
        this.doctorSeleccionado = this.lstDoctores.filter(x => x.nombre == data)[0].id.toString();

      }
    });
    console.log('sidenav2');
    this.logeado = false;
    if (this.loginService.IsSingned()) {
      let loginToken = this.loginService.decodeToken();
      this.emailUsuario = loginToken.correo;
      if (loginToken && loginToken.id) {
        this.logeado = true;
        let usuario = await this.usuariosService.Get(loginToken.id);
        if (usuario.idUsuario != undefined) {
          this.usuariosService.outUsuario.emit(usuario);
          // this.router.navigate(['/']);
        }

      }
    }
    console.log('sidenav3');
    
    
  }

  async mostrarHistoria() {
    if (this.idPacienteSeleccionado) {
      this.router.navigate(['/datos-personales']);
      this.setMostrarBuscarHistoriaClinica(true);
    } else {
      this.router.navigate(['/']);
      this.setMostrarBuscarHistoriaClinica(true);
    }
  }

  
  toggleMenu() {
    this.menuExpandido = !this.menuExpandido;
  }

  async iniciarSesion() {
    let resultadoConsultaUsuario = await this.usuariosService.ConsultarCorreoyFechaActivo(this.correo);
    if (resultadoConsultaUsuario.status == 1) {
      this.logeado = true;
      let usuario = await this.usuariosService.ConsultarPorCorreo(this.correo);
      if (usuario.idUsuario != undefined) {
        this.usuariosService.outUsuario.emit(usuario);
      }
    }
    else {
      this.logeado = false;
    }
  }

  //Evento mostrar y ocultar menu
  open_close_menu() {
    this.menuOpen = !this.menuOpen; // Cambia el estado del menú
    console.log("click");
    console.log("click");
  }

  private destroy$ = new Subject<void>();

  getInitials(titulo: string): string {
    return titulo.split(' ').map(word => word[0]).join(' ');
  }
  async pedirPinSedeSeleccionada(idSede: number) {
    let sedeSeleccionadaConectada = null;
    console.log(idSede);
    console.log(this.usuarioActual);
    //limpia datos 
    this.limpiarVariablesCambioSede();

    sedeSeleccionadaConectada = await this.sedesConectadasService.startConnectionRespuestaObtenerActualizarSedesActivasPorCliente(this.usuarioActual.idCliente);
    this.sedesConectadas = sedeSeleccionadaConectada;
    console.log(sedeSeleccionadaConectada);
    //console.log(sedeSeleccionadaConectada.filter(x => x.idSede == idSede && x.activo == true));
    console.log(sedeSeleccionadaConectada);
    console.log(this.sedesConectadas);
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
          if (result !== 'no-action') {
            this.lstDoctores = result.obtenerPinRepuesta.lstDoctores;
            if (this.lstDoctores.length > 0) {
              this.mostrarDoctores = true;
              this.mostrarSedes = false;
              // Verifica el ancho de la ventana sin suscripción
              if (window.matchMedia('(max-width: 600px)').matches) {
                this.mostrarTitulo = false;
              }
              return result;
            }
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
      this.limpiarVariablesCambioSede();
      //this.lstDoctores = [];
      //this.doctorSeleccionado = "";
      //this.totalPacientesDoctorSeleccionado = 0;
      //this.mostrarDoctores = false;
      //this.mostrarSedes = true;
      return;
    }
  }

  limpiarVariablesCambioSede() {
    this.lstDoctores = [];
    this.doctorSeleccionado = "";
    this.totalPacientesDoctorSeleccionado = 0;
    this.mostrarDoctores = false;
    this.mostrarSedes = true;
    this.respuestaPinService.updateAnamnesisData(0);
    this.respuestaPinService.updateNombrePacienteEscogidoData("");
    this.respuestaPinService.updateNotaImportante("");
  }

  setMostrarBuscarHistoriaClinica(value: boolean) {
    this.mostrarBuscarHistoriaClinica = value;
  }

  async cerrarSession() {
    await this.signalRService.stopConnection();
    this.loginService.signOut();
  }





  async onDoctorSeleccionado(idDoctor: number) {

    // Aquí es donde haces la consulta a SignalR
    if (this.sedeConectadaActual.idSede != undefined) {

      await this.respuestaObtenerDoctorService.startConnectionRespuestaObtenerPacientesDoctorSeleccionado(this.sedeConectadaActual.idActualSignalR, idDoctor);
      this.doctorEscogido = this.lstDoctores.filter(x => x.id == idDoctor)[0].nombre;
      if (this.doctorEscogido) {
        this.respuestaPinService.updateDoctorSeleccionado(this.doctorEscogido);

      }
      this.respuestaPinService.updateCambiarDoctorSeleccionado(this.doctorEscogido);

      this.mostrarBuscarHistoriaClinica = true;
      this.mostrarCerrarSesion = false;
      
      if (this.idPacienteSeleccionado) {
        // Espera un momento para asegurarte de que los datos estén listos
        setTimeout(() => {
          this.router.navigate(['/datos-personales']);
        }, 100); // Ajusta el tiempo según sea necesario
      }
      // Navega a la página de buscar historia clínica (comentado)
      //this.router.navigate(['/buscar-historia-clinica']);
      //this.router.navigate(['/buscar-hitoria-clinica']);

    }
  }

  async buscarPacientesDoctorSeleccionado() { }

}
