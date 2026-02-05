import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { ProgresoRipsModel } from './generar-rips.model';

@Injectable({
  providedIn: 'root',
})
export class GenerarRipsService {
  @Output() respuestaGenerarRipsEmit: EventEmitter<string> =
    new EventEmitter<string>();
  @Output() respuestaPresentarRipsEmit: EventEmitter<string> =
    new EventEmitter<string>();

  // ✅ Progreso compartido (para que el componente lo muestre)
  private progresoRips = new BehaviorSubject<ProgresoRipsModel | null>(null);
  sharedProgresoRips = this.progresoRips.asObservable();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  // =========================
  // GENERAR (descargar json)
  // =========================
  async startConnectionGenerarRips(
    clienteId: string,
    identificador: number,
    objGenerarRips: string,
  ): Promise<void> {
    try {
      await this.signalRService.ensureConnection();

      // Reset progreso al iniciar
      this.progresoRips.next({
        accion: 'GENERAR',
        total: 0,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        mensaje: 'Iniciando generación...',
      });

      // Error de conexión
      this.signalRService.off('ErrorConexion');
      this.signalRService.on(
        'ErrorConexion',
        (clienteId: string, mensajeError: string) => {
          alert(
            'Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId,
          );
          this.respuestaPinService.updateisLoading(false);
          this.interruptionService.interrupt();
        },
      );

      // ✅ Progreso (evento que debe mandar el backend)
      // Nombre recomendado: "ProgresoRips"
      this.signalRService.off('ProgresoRips');
      this.signalRService.on(
        'ProgresoRips',
        (clienteId: string, payload: any) => {
          const prog = this.safeParseProgreso(payload);
          if (!prog) return;
          // Solo tomamos lo que corresponda a GENERAR
          if (prog.accion !== 'GENERAR') return;
          this.progresoRips.next(prog);
        },
      );

      // Respuesta final
      this.signalRService.off('RespuestaGenerarRips');
      this.signalRService.on(
        'RespuestaGenerarRips',
        async (clienteId: string, payload: string) => {
          try {
            const respuesta = JSON.parse(payload);
            await this.signalRService.hubConnection.stop();

            this.respuestaGenerarRipsEmit.emit(respuesta);
            await this.respuestaPinService.updateRespuestaGenerarJsonRipsPresentado(
              respuesta,
            );

            // Finaliza loading + progreso completo
            this.progresoRips.next({
              accion: 'GENERAR',
              total: 1,
              procesadas: 1,
              exitosas: 1,
              fallidas: 0,
              mensaje: 'Generación finalizada.',
            });

            this.respuestaPinService.updateisLoading(false);
            await this.signalRService.stopConnection();
          } catch (error) {
            console.error(
              'Error durante el procesamiento de la respuesta: ',
              error,
            );
            this.respuestaPinService.updateisLoading(false);
          }
        },
      );

      // Invocar
      console.log('Invocando método GenerarRips...');
      await this.signalRService.invoke(
        'GenerarRips',
        clienteId,
        identificador,
        objGenerarRips,
      );
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
      this.respuestaPinService.updateisLoading(false);
    }
  }

  // =========================
  // PRESENTAR (enviar a SISPRO)
  // =========================
  async startConnectionPresentarRips(
    clienteId: string,
    identificador: number,
    objPresentarRips: string,
  ): Promise<void> {
    try {
      await this.signalRService.ensureConnection();

      // Reset progreso al iniciar
      this.progresoRips.next({
        accion: 'PRESENTAR',
        total: 0,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        mensaje: 'Iniciando presentación...',
      });

      // Error de conexión
      this.signalRService.off('ErrorConexion');
      this.signalRService.on(
        'ErrorConexion',
        (clienteId: string, mensajeError: string) => {
          alert(
            'Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId,
          );
          this.respuestaPinService.updateisLoading(false);
          this.interruptionService.interrupt();
        },
      );

      // ✅ Progreso
      this.signalRService.off('ProgresoRips');
      this.signalRService.on(
        'ProgresoRips',
        (clienteId: string, payload: any) => {
          const prog = this.safeParseProgreso(payload);
          if (!prog) return;
          if (prog.accion !== 'PRESENTAR') return;
          this.progresoRips.next(prog);
        },
      );

      // Respuesta final
      this.signalRService.off('RespuestaPresentarRips');
      this.signalRService.on(
        'RespuestaPresentarRips',
        async (clienteId: string, payload: string) => {
          try {
            const respuesta = JSON.parse(payload);
            await this.signalRService.hubConnection.stop();

            this.respuestaPresentarRipsEmit.emit(respuesta);
            await this.respuestaPinService.updateRespuestaDockerJsonRipsPresentado(
              respuesta,
            );

            this.progresoRips.next({
              accion: 'PRESENTAR',
              total: 1,
              procesadas: 1,
              exitosas: 1,
              fallidas: 0,
              mensaje: 'Presentación finalizada.',
            });

            this.respuestaPinService.updateisLoading(false);
            await this.signalRService.stopConnection();
          } catch (error) {
            console.error(
              'Error durante el procesamiento de la respuesta: ',
              error,
            );
            this.respuestaPinService.updateisLoading(false);
          }
        },
      );

      // Invocar
      console.log('Invocando método PresentarRips...');
      await this.signalRService.invoke(
        'PresentarRips',
        clienteId,
        identificador,
        objPresentarRips,
      );
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
      this.respuestaPinService.updateisLoading(false);
    }
  }

  // =========================
  // Helpers
  // =========================
  private safeParseProgreso(payload: any): ProgresoRipsModel | null {
    try {
      // a veces llega como string JSON
      const obj = typeof payload === 'string' ? JSON.parse(payload) : payload;
      if (!obj) return null;

      // normaliza faltantes
      const prog: ProgresoRipsModel = {
        accion: obj.accion,
        total: Number(obj.total ?? 0),
        procesadas: Number(obj.procesadas ?? 0),
        exitosas: Number(obj.exitosas ?? 0),
        fallidas: Number(obj.fallidas ?? 0),
        ultimoDocumento:
          obj.ultimoDocumento ?? obj.ultimaFactura ?? obj.numFactura,
        mensaje: obj.mensaje ?? '',
        startedAtIso: obj.startedAtIso ?? undefined,
      };

      return prog;
    } catch {
      return null;
    }
  }
}
