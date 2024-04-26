import { Component, OnInit } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Sedes, SedesService } from './conexiones/sedes';
import { SedesConectadas, SedesConectadasService } from './conexiones/sedes-conectadas';
import { UsuariosService, Usuarios } from './conexiones/usuarios';
import { RespuestaPinService } from './conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from './helpers/interruption';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
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
    private interruptionService: InterruptionService
  ) { }

  async ngOnInit() {
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
      this.sedesConectadas = await this.sedesConectadasService.ConsultarSedesConectadasActivasPorCliente(this.usuarioActual.idCliente.toString());
      console.log(this.sedes);
    });
    this.respuestaPinService.idSedeActualSignalREmit.subscribe(async (value: string) => {
      console.log(value);
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


