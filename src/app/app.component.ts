import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Sedes, SedesService } from './conexiones/sedes';
import { UsuariosService, Usuarios } from './conexiones/usuarios';
import { RespuestaPinService } from './conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from './helpers/interruption';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { SedesConectadas } from './conexiones/sedes-conectadas';
import { SessionActivityService } from './helpers/session-activity/session-activity.service';
import { LoginService } from './componentes/login';

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
    private sessionActivityService: SessionActivityService,
    private loginService: LoginService,
  ) {}

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(_event: BeforeUnloadEvent): void {
    // sin bloqueo
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler(_event: Event): void {
    void this.signalRService.stopConnection();
  }

  async ngOnInit() {
    console.log('Iniciando aplicación...');

    if (this.loginService.IsSingned()) {
      this.sessionActivityService.start();
    }

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
    this.sessionActivityService.stop();

    this.interruptionSubscription?.unsubscribe();
    this.usuarioSub?.unsubscribe();
    this.sedeIdSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  detenerProceso() {
    this.router.navigate(['/']);
  }
}
