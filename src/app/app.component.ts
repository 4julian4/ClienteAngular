import { Component, OnInit } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Sedes, SedesService } from './conexiones/sedes';
import { SedesConectadas, SedesConectadasService } from './conexiones/sedes-conectadas';
import { UsuariosService, Usuarios } from './conexiones/usuarios';
import { RespuestaPinService } from './conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from './helpers/interruption';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';


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
    private sedesConectadasService: SedesConectadasService,
    private usuariosService: UsuariosService,
    private respuestaPinService: RespuestaPinService,
    private interruptionService: InterruptionService,
    private router: Router
  ) { }

  async ngOnInit() {

    this.router.events.subscribe(() => {
      // Verifica si la ruta actual es la raíz o página de inicio
      this.showImage = this.router.url === '/';
    });
    //this.signalRService.startConnection();
    //this.signalRService.mensajes$.subscribe((mensaje: string) => {
    //this.mensajes.push(mensaje);
    //});
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
  }


  detenerProceso() {
    //aca va el codigo que me va llevar nuevamente a listar las sedes y quitar menus
    //limpiar variables limpiar servicios o cualquier cosa que sea necesaria 
    this.interruptionService.interrupt(); 
  }

  enviarMensaje() {
    if (this.mensaje.trim() !== '') {
      this.signalRService.enviarMensaje(this.mensaje);
      this.mensaje = '';
    }
  }
}


