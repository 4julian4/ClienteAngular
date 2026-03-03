/*import { Component, HostListener, OnInit } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Sedes, SedesService } from './conexiones/sedes';
import {
  SedesConectadas,
  SedesConectadasService,
} from './conexiones/sedes-conectadas';
import { UsuariosService, Usuarios } from './conexiones/usuarios';
import { RespuestaPinService } from './conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from './helpers/interruption';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { HubConnectionState } from '@microsoft/signalr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  showImage = true;
  mensaje: string = '';
  mensajes: string[] = [];
  sedes: Sedes[] = [];
  sedesConectadas: SedesConectadas[] = [];
  usuarioActual: Usuarios = new Usuarios();
  idSedeActualSignalR: string = '';
  private interruptionSubscription?: Subscription;

  constructor(
    private signalRService: SignalRService,
    private sedesService: SedesService,
    //private sedesConectadasService: SedesConectadasService,
    private usuariosService: UsuariosService,
    private respuestaPinService: RespuestaPinService,
    private interruptionService: InterruptionService,
    private router: Router
  ) {}

  // Preguntar antes de cerrar o recargar la página
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: BeforeUnloadEvent): void {
    if (
      this.signalRService.hubConnection.state === HubConnectionState.Connected
    ) {
      event.preventDefault();
      event.returnValue = false; // Necesario para algunos navegadores
    }
  }

  // Detener la conexión solo cuando el usuario cierra o recarga la página
  @HostListener('window:unload', ['$event'])
  async unloadHandler(event: Event): Promise<void> {
    if (
      this.signalRService.hubConnection.state === HubConnectionState.Connected
    ) {
      await this.signalRService.hubConnection.stop();
    }
  }
  //cambio pa solucionar error
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
    this.interruptionSubscription = this.interruptionService
      .onInterrupt()
      .subscribe(() => {
        this.detenerProceso();
      });

    this.usuariosService.outUsuario.subscribe(async (value: Usuarios) => {
      this.usuarioActual = value;
      this.sedes = await this.sedesService.ConsultarPorIdCliente(
        this.usuarioActual.idCliente.toString()
      );
      //this.sedesConectadas = await this.sedesConectadasService.ConsultarSedesConectadasActivasPorCliente(this.usuarioActual.idCliente.toString());
    });

    this.respuestaPinService.idSedeActualSignalREmit.subscribe(
      async (value: string) => {
        this.idSedeActualSignalR = value;
      }
    );
    console.log('Aplicación iniciada.');
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

  async enviarMensaje(mensaje: string) {
    this.hubConnection.invoke('ObtenerPin', mensaje, '123')
      .catch(err => console.error(err));
    return this.hubConnection
      .invoke('SendMessage', this.hubConnection.connectionId, mensaje)
      .catch(err => console.error(err));
  }
}*/

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Sedes, SedesService } from './conexiones/sedes';
import { UsuariosService, Usuarios } from './conexiones/usuarios';
import { RespuestaPinService } from './conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from './helpers/interruption';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { SedesConectadas } from './conexiones/sedes-conectadas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  showImage = true;

  sedes: Sedes[] = [];
  sedesConectadas: SedesConectadas[] = [];
  usuarioActual: Usuarios = new Usuarios();
  idSedeActualSignalR: string = '';

  private interruptionSubscription?: Subscription;
  private usuarioSub?: Subscription;
  private sedeIdSub?: Subscription;
  private routerSub?: Subscription;

  constructor(
    private signalRService: SignalRService,
    private sedesService: SedesService,
    private usuariosService: UsuariosService,
    private respuestaPinService: RespuestaPinService,
    private interruptionService: InterruptionService,
    private router: Router,
  ) {}

  // ✅ NO bloquear el cierre del navegador solo por tener SignalR conectado
  // (con tu nuevo diseño, SignalR puede estar conectado todo el día)
  // Si de verdad quieres bloquear SOLO cuando haya un proceso crítico en curso,
  // eso lo manejamos luego con un flag (ej: isBusy).
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(_event: BeforeUnloadEvent): void {
    // sin bloqueo
  }

  // ✅ Intentar cerrar la conexión cuando se cierra la pestaña
  @HostListener('window:unload', ['$event'])
  unloadHandler(_event: Event): void {
    // Importante: en unload, NO esperes await (muchos navegadores lo ignoran)
    // Solo dispara el stop de forma best-effort:
    void this.signalRService.stopConnection();
  }

  async ngOnInit() {
    console.log('Iniciando aplicación...');

    this.routerSub = this.router.events.subscribe(() => {
      this.showImage = this.router.url === '/';
    });

    this.interruptionSubscription = this.interruptionService
      .onInterrupt()
      .subscribe(() => {
        this.detenerProceso();
      });

    this.usuarioSub = this.usuariosService.outUsuario.subscribe(
      async (value: Usuarios) => {
        this.usuarioActual = value;

        // Si el usuario no está listo aún, evita llamadas raras
        if (!this.usuarioActual?.idCliente) return;

        this.sedes = await this.sedesService.ConsultarPorIdCliente(
          this.usuarioActual.idCliente.toString(),
        );
      },
    );

    this.sedeIdSub = this.respuestaPinService.idSedeActualSignalREmit.subscribe(
      (value: string) => {
        this.idSedeActualSignalR = value;
      },
    );

    console.log('Aplicación iniciada.');
  }

  ngOnDestroy(): void {
    this.interruptionSubscription?.unsubscribe();
    this.usuarioSub?.unsubscribe();
    this.sedeIdSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  detenerProceso() {
    // OJO: aquí no llames interrupt() dentro del mismo interrupt handler,
    // porque puedes crear bucle (interrupt -> detenerProceso -> interrupt -> ...).
    // Mejor: aquí limpias estado y navegas.
    // Si quieres disparar "logout" o volver a sedes, lo hacemos explícito:
    // this.router.navigate(['/']);
    this.router.navigate(['/']);
  }
}
