/*import { EventEmitter, Injectable, Output } from '@angular/core';
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
}*/

// src/app/.../generar-rips.service.ts
import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { ProgresoRipsModel } from './generar-rips.model';

@Injectable({ providedIn: 'root' })
export class GenerarRipsService {
  @Output() respuestaGenerarRipsEmit = new EventEmitter<string>();
  @Output() respuestaPresentarRipsEmit = new EventEmitter<string>();

  private progresoRips = new BehaviorSubject<ProgresoRipsModel | null>(null);
  sharedProgresoRips = this.progresoRips.asObservable();

  // ✅ refs de handlers (para off seguro)
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onProgresoRips?: (returnId: string, payload: any) => void;
  private onRespuestaGenerarRips?: (returnId: string, payload: string) => void;
  private onRespuestaPresentarRips?: (
    returnId: string,
    payload: string,
  ) => void;

  // ✅ opcional: evita disparar 2 procesos al tiempo
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  // =========================
  // GENERAR (descargar json)
  // =========================
  async startConnectionGenerarRips(
    sedeId: number,
    //targetId: string, // ✅ antes clienteId: este es el TARGET (sede/worker)
    identificador: number,
    objGenerarRips: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    // ✅ returnId del browser SIEMPRE es el connectionId actual del hub
    const returnId = this.signalRService.hubConnection?.connectionId ?? '';

    try {
      await this.signalRService.ensureConnection();

      // (por si cambió tras ensureConnection)
      const returnIdNow =
        this.signalRService.hubConnection?.connectionId ?? returnId;

      // Reset progreso al iniciar
      this.progresoRips.next({
        accion: 'GENERAR',
        total: 0,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        mensaje: 'Iniciando generación...',
      });

      // ✅ limpiar SOLO nuestros handlers previos
      this.detachHandlers();

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnIdNow)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ ProgresoRips (filtrado por RETURN-ID)
      this.onProgresoRips = (returnIdResp: string, payload: any) => {
        if (String(returnIdResp) !== String(returnIdNow)) return;

        const prog = this.safeParseProgreso(payload);
        if (!prog) return;
        if (prog.accion !== 'GENERAR') return;

        this.progresoRips.next(prog);
      };
      this.signalRService.on('ProgresoRips', this.onProgresoRips);

      // ✅ Respuesta final Generar (filtrado por RETURN-ID)
      this.onRespuestaGenerarRips = async (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnIdNow)) return;

        try {
          const respuesta = JSON.parse(payload);

          this.respuestaGenerarRipsEmit.emit(respuesta);
          await this.respuestaPinService.updateRespuestaGenerarJsonRipsPresentado(
            respuesta,
          );

          this.progresoRips.next({
            accion: 'GENERAR',
            total: 1,
            procesadas: 1,
            exitosas: 1,
            fallidas: 0,
            mensaje: 'Generación finalizada.',
          });
        } catch (error) {
          console.error(
            'Error durante el procesamiento de la respuesta:',
            error,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);

          // ✅ opcional: si NO quieres quedar escuchando
          // this.detachHandlers();
        }
      };
      this.signalRService.on(
        'RespuestaGenerarRips',
        this.onRespuestaGenerarRips,
      );

      // Invocar
      console.log('Invocando método GenerarRips...');
      console.log('RIPS GENERAR -> TARGET enviado:', sedeId);
      console.log('RIPS GENERAR -> returnId actual:', returnIdNow);

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        'GenerarRips',
        sedeId,
        identificador,
        objGenerarRips,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlight = false;
    }
  }

  // =========================
  // PRESENTAR (enviar a SISPRO)
  // =========================
  async startConnectionPresentarRips(
    //targetId: string, // ✅ antes clienteId: este es el TARGET (sede/worker)
    sedeId: number,
    identificador: number,
    objPresentarRips: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      const returnIdNow = this.signalRService.hubConnection?.connectionId ?? '';
      this.progresoRips.next({
        accion: 'PRESENTAR',
        total: 0,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        mensaje: 'Iniciando presentación...',
      });

      // ✅ limpiar SOLO nuestros handlers previos
      this.detachHandlers();

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnIdNow)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ ProgresoRips (filtrado por RETURN-ID)
      this.onProgresoRips = (returnIdResp: string, payload: any) => {
        if (String(returnIdResp) !== String(returnIdNow)) return;

        const prog = this.safeParseProgreso(payload);
        if (!prog) return;
        if (prog.accion !== 'PRESENTAR') return;

        this.progresoRips.next(prog);
      };
      this.signalRService.on('ProgresoRips', this.onProgresoRips);

      // ✅ Respuesta final Presentar (filtrado por RETURN-ID)
      this.onRespuestaPresentarRips = async (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnIdNow)) return;

        try {
          const respuesta = JSON.parse(payload);

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
        } catch (error) {
          console.error(
            'Error durante el procesamiento de la respuesta:',
            error,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);

          // ✅ opcional: si NO quieres quedar escuchando
          // this.detachHandlers();
        }
      };
      this.signalRService.on(
        'RespuestaPresentarRips',
        this.onRespuestaPresentarRips,
      );

      console.log('Invocando método PresentarRips...');
      console.log('RIPS PRESENTAR -> TARGET enviado:', sedeId);
      console.log('RIPS PRESENTAR -> returnId actual:', returnIdNow);

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        'PresentarRips',
        //targetId,
        sedeId,
        identificador,
        objPresentarRips,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlight = false;
    }
  }

  // =========================
  // Detach seguro
  // =========================
  private detachHandlers(): void {
    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
      this.onErrorConexion = undefined;
    }
    if (this.onProgresoRips) {
      this.signalRService.off('ProgresoRips', this.onProgresoRips);
      this.onProgresoRips = undefined;
    }
    if (this.onRespuestaGenerarRips) {
      this.signalRService.off(
        'RespuestaGenerarRips',
        this.onRespuestaGenerarRips,
      );
      this.onRespuestaGenerarRips = undefined;
    }
    if (this.onRespuestaPresentarRips) {
      this.signalRService.off(
        'RespuestaPresentarRips',
        this.onRespuestaPresentarRips,
      );
      this.onRespuestaPresentarRips = undefined;
    }
  }

  private safeParseProgreso(payload: any): ProgresoRipsModel | null {
    try {
      const obj = typeof payload === 'string' ? JSON.parse(payload) : payload;
      if (!obj) return null;

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
