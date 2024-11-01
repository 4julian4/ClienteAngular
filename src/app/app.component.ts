import { Component, HostListener, OnInit } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Sedes, SedesService } from './conexiones/sedes';
import { SedesConectadas, SedesConectadasService } from './conexiones/sedes-conectadas';
import { UsuariosService, Usuarios } from './conexiones/usuarios';
import { RespuestaPinService } from './conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from './helpers/interruption';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { HubConnectionState } from '@microsoft/signalr';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  showImage = true;
  mensaje: string = '';
  mensajes: string[] = [];
  sedes: Sedes[] = [];
  sedesConectadas: SedesConectadas[] = [];
  usuarioActual: Usuarios = new Usuarios();
  idSedeActualSignalR: string = "";
  private interruptionSubscription?: Subscription;

  constructor(private signalRService: SignalRService,
    private sedesService: SedesService,
    //private sedesConectadasService: SedesConectadasService,
    private usuariosService: UsuariosService,
    private respuestaPinService: RespuestaPinService,
    private interruptionService: InterruptionService,
    private router: Router
  ) { }

  // Preguntar antes de cerrar o recargar la página
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: BeforeUnloadEvent): void {
    if (this.signalRService.hubConnection.state === HubConnectionState.Connected) {
      event.preventDefault();
      event.returnValue = false; // Necesario para algunos navegadores
    }
  }

  // Detener la conexión solo cuando el usuario cierra o recarga la página
  @HostListener('window:unload', ['$event'])
  async unloadHandler(event: Event): Promise<void> {
    if (this.signalRService.hubConnection.state === HubConnectionState.Connected) {
      await this.signalRService.hubConnection.stop();
    }
  }

  async ngOnInit() {
    console.log('Iniciando aplicación...');
    this.router.events.subscribe(() => {
      // Verifica si la ruta actual es la raíz o página de inicio
      this.showImage = this.router.url === '/';
    });
    //this.signalRService.startConnection();
    //this.signalRService.mensajes$.subscribe((mensaje: string) => {
    //this.mensajes.push(mensaje);
    //});
    await this.signalRService.ensureConnection();
    this.interruptionSubscription = this.interruptionService.onInterrupt().subscribe(() => {
      this.detenerProceso();
    });

        
    this.usuariosService.outUsuario.subscribe(async (value: Usuarios) => {
      this.usuarioActual = value;
      this.sedes = await this.sedesService.ConsultarPorIdCliente(this.usuarioActual.idCliente.toString());
      //this.sedesConectadas = await this.sedesConectadasService.ConsultarSedesConectadasActivasPorCliente(this.usuarioActual.idCliente.toString());
    });

    this.respuestaPinService.idSedeActualSignalREmit.subscribe(async (value: string) => {
      this.idSedeActualSignalR = value;
    });
    console.log('Aplicación iniciada.');
  }


  detenerProceso() {
    //aca va el codigo que me va llevar nuevamente a listar las sedes y quitar menus
    //limpiar variables limpiar servicios o cualquier cosa que sea necesaria 
    this.interruptionService.interrupt(); 
  }

  /*enviarMensaje() {
    if (this.mensaje.trim() !== '') {
      this.signalRService.enviarMensaje(this.mensaje);
      this.mensaje = '';
    }
  }*/

    
    /*async enviarMensaje(mensaje: string) {
    this.hubConnection.invoke('ObtenerPin', mensaje, '123')
      .catch(err => console.error(err));
    return this.hubConnection
      .invoke('SendMessage', this.hubConnection.connectionId, mensaje)
      .catch(err => console.error(err));
  }*/
}


