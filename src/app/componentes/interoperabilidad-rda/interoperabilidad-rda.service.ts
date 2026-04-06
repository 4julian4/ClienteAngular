import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import {
  RdaAccionResultado,
  RdaAccionResultadoRaw,
  RdaControlFiltro,
  RdaControlRespuesta,
  RdaLoteResultado,
  RdaLoteResultadoRaw,
  RdaProcesoMasivoProgress,
} from './interoperabilidad-rda.model';

@Injectable({
  providedIn: 'root',
})
export class InteroperabilidadRdaService {
  @Output() respuestaConsultarRdaEmit = new EventEmitter<RdaControlRespuesta>();
  @Output() respuestaReenviarRdaEmit = new EventEmitter<RdaAccionResultado>();
  @Output() respuestaRegenerarRdaEmit = new EventEmitter<RdaAccionResultado>();

  @Output() respuestaReenviarRdaLoteEmit = new EventEmitter<RdaLoteResultado>();
  @Output() respuestaRegenerarRdaLoteEmit =
    new EventEmitter<RdaLoteResultado>();

  private progresoRda = new BehaviorSubject<RdaProcesoMasivoProgress | null>(
    null,
  );
  sharedProgresoRda = this.progresoRda.asObservable();

  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaConsultarRda?: (returnId: string, payload: string) => void;
  private onRespuestaReenviarRda?: (returnId: string, payload: string) => void;
  private onRespuestaRegenerarRda?: (returnId: string, payload: string) => void;

  private onRespuestaReenviarRdaLote?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespuestaRegenerarRdaLote?: (
    returnId: string,
    payload: string,
  ) => void;
  private onProgresoRda?: (returnId: string, payload: any) => void;

  private requestInFlightConsultar = false;
  private requestInFlightReenviar = false;
  private requestInFlightRegenerar = false;
  private requestInFlightLote = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async consultarRda(sedeId: number, filtro: RdaControlFiltro): Promise<void> {
    if (this.requestInFlightConsultar) return;
    this.requestInFlightConsultar = true;

    try {
      await this.signalRService.ensureConnection();
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      this.cleanupConsultarHandlers();
      this.progresoRda.next(null);
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        this.respuestaPinService.updateisLoading(false);
        alert('Error de conexión: ' + mensajeError);
        this.interruptionService.interrupt();
        this.cleanupConsultarHandlers();
      };

      this.onRespuestaConsultarRda = (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const data = payload
            ? (JSON.parse(payload) as RdaControlRespuesta)
            : { items: [] };
          this.respuestaConsultarRdaEmit.emit(data);
        } catch (error) {
          console.error('Error procesando respuestaConsultarRda:', error);
        } finally {
          this.respuestaPinService.updateisLoading(false);
          this.cleanupConsultarHandlers();
        }
      };

      this.signalRService.on('ErrorConexion', this.onErrorConexion);
      this.signalRService.on(
        'RespuestaConsultarRdaControl',
        this.onRespuestaConsultarRda,
      );

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        'ConsultarRdaControl',
        sedeId,
        JSON.stringify(filtro),
      );
    } catch (err) {
      console.error('Error al consultar RDA:', err);
      this.respuestaPinService.updateisLoading(false);
      this.cleanupConsultarHandlers();
    } finally {
      this.requestInFlightConsultar = false;
    }
  }

  async reenviarRda(
    sedeId: number,
    idRda: number,
  ): Promise<RdaAccionResultado> {
    if (this.requestInFlightReenviar) {
      return {
        ok: false,
        idRda,
        estado: 'OCUPADO',
        mensaje: 'Ya hay una solicitud de reenvío en curso.',
      };
    }

    this.requestInFlightReenviar = true;

    try {
      await this.signalRService.ensureConnection();
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      this.cleanupReenviarHandlers();

      return await new Promise<RdaAccionResultado>(async (resolve) => {
        this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
          if (String(returnIdResp) !== String(returnId)) return;

          const resultado: RdaAccionResultado = {
            ok: false,
            idRda,
            estado: 'ERROR_CONEXION',
            mensaje: mensajeError || 'Error de conexión.',
          };

          this.respuestaPinService.updateisLoading(false);
          this.respuestaReenviarRdaEmit.emit(resultado);
          this.interruptionService.interrupt();
          this.cleanupReenviarHandlers();
          resolve(resultado);
        };

        this.onRespuestaReenviarRda = (
          returnIdResp: string,
          payload: string,
        ) => {
          if (String(returnIdResp) !== String(returnId)) return;

          try {
            const raw = payload
              ? (JSON.parse(payload) as RdaAccionResultadoRaw)
              : {};
            const data = this.normalizeAccionResultado(raw, idRda);
            this.respuestaReenviarRdaEmit.emit(data);
            resolve(data);
          } catch (error) {
            console.error('Error procesando respuestaReenviarRda:', error);

            const resultado: RdaAccionResultado = {
              ok: false,
              idRda,
              estado: 'ERROR_PARSE',
              mensaje: 'No fue posible procesar la respuesta del servidor.',
            };

            this.respuestaReenviarRdaEmit.emit(resultado);
            resolve(resultado);
          } finally {
            this.respuestaPinService.updateisLoading(false);
            this.cleanupReenviarHandlers();
          }
        };

        this.signalRService.on('ErrorConexion', this.onErrorConexion);
        this.signalRService.on(
          'RespuestaReenviarRda',
          this.onRespuestaReenviarRda,
        );

        this.respuestaPinService.updateisLoading(true);

        try {
          await this.signalRService.invoke('ReenviarRda', sedeId, idRda);
        } catch (err) {
          console.error('Error al reenviar RDA:', err);
          this.respuestaPinService.updateisLoading(false);

          const resultado: RdaAccionResultado = {
            ok: false,
            idRda,
            estado: 'ERROR_INVOKE',
            mensaje: 'No fue posible iniciar el reenvío.',
          };

          this.cleanupReenviarHandlers();
          resolve(resultado);
        }
      });
    } finally {
      this.requestInFlightReenviar = false;
    }
  }

  async regenerarRda(
    sedeId: number,
    idRda: number,
  ): Promise<RdaAccionResultado> {
    if (this.requestInFlightRegenerar) {
      return {
        ok: false,
        idRda,
        estado: 'OCUPADO',
        mensaje: 'Ya hay una solicitud de regeneración en curso.',
      };
    }

    this.requestInFlightRegenerar = true;

    try {
      await this.signalRService.ensureConnection();
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      this.cleanupRegenerarHandlers();

      return await new Promise<RdaAccionResultado>(async (resolve) => {
        this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
          if (String(returnIdResp) !== String(returnId)) return;

          const resultado: RdaAccionResultado = {
            ok: false,
            idRda,
            estado: 'ERROR_CONEXION',
            mensaje: mensajeError || 'Error de conexión.',
          };

          this.respuestaPinService.updateisLoading(false);
          this.respuestaRegenerarRdaEmit.emit(resultado);
          this.interruptionService.interrupt();
          this.cleanupRegenerarHandlers();
          resolve(resultado);
        };

        this.onRespuestaRegenerarRda = (
          returnIdResp: string,
          payload: string,
        ) => {
          if (String(returnIdResp) !== String(returnId)) return;

          try {
            const raw = payload
              ? (JSON.parse(payload) as RdaAccionResultadoRaw)
              : {};
            const data = this.normalizeAccionResultado(raw, idRda);
            this.respuestaRegenerarRdaEmit.emit(data);
            resolve(data);
          } catch (error) {
            console.error('Error procesando respuestaRegenerarRda:', error);

            const resultado: RdaAccionResultado = {
              ok: false,
              idRda,
              estado: 'ERROR_PARSE',
              mensaje: 'No fue posible procesar la respuesta del servidor.',
            };

            this.respuestaRegenerarRdaEmit.emit(resultado);
            resolve(resultado);
          } finally {
            this.respuestaPinService.updateisLoading(false);
            this.cleanupRegenerarHandlers();
          }
        };

        this.signalRService.on('ErrorConexion', this.onErrorConexion);
        this.signalRService.on(
          'RespuestaRegenerarRda',
          this.onRespuestaRegenerarRda,
        );

        this.respuestaPinService.updateisLoading(true);

        try {
          await this.signalRService.invoke('RegenerarRda', sedeId, idRda);
        } catch (err) {
          console.error('Error al regenerar RDA:', err);
          this.respuestaPinService.updateisLoading(false);

          const resultado: RdaAccionResultado = {
            ok: false,
            idRda,
            estado: 'ERROR_INVOKE',
            mensaje: 'No fue posible iniciar la regeneración.',
          };

          this.cleanupRegenerarHandlers();
          resolve(resultado);
        }
      });
    } finally {
      this.requestInFlightRegenerar = false;
    }
  }

  async reenviarRdaLote(
    sedeId: number,
    ids: number[],
  ): Promise<RdaLoteResultado> {
    return this.ejecutarLote(
      'REENVIO_MASIVO',
      sedeId,
      ids,
      'ReenviarRdaLote',
      'RespuestaReenviarRdaLote',
    );
  }

  async regenerarRdaLote(
    sedeId: number,
    ids: number[],
  ): Promise<RdaLoteResultado> {
    return this.ejecutarLote(
      'REGENERACION_MASIVA',
      sedeId,
      ids,
      'RegenerarRdaLote',
      'RespuestaRegenerarRdaLote',
    );
  }

  private async ejecutarLote(
    accion: 'REENVIO_MASIVO' | 'REGENERACION_MASIVA',
    sedeId: number,
    ids: number[],
    hubMethod: 'ReenviarRdaLote' | 'RegenerarRdaLote',
    responseEvent: 'RespuestaReenviarRdaLote' | 'RespuestaRegenerarRdaLote',
  ): Promise<RdaLoteResultado> {
    if (this.requestInFlightLote) {
      return {
        ok: false,
        accion,
        total: ids?.length ?? 0,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        mensaje: 'Ya hay un proceso masivo en curso.',
        resultados: [],
      };
    }

    this.requestInFlightLote = true;

    try {
      await this.signalRService.ensureConnection();
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      this.cleanupLoteHandlers();

      this.progresoRda.next({
        accion,
        total: ids?.length ?? 0,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        mensaje:
          accion === 'REENVIO_MASIVO'
            ? 'Iniciando reenvío masivo...'
            : 'Iniciando regeneración masiva...',
        ultimoDocumento: null,
        enCurso: true,
      });

      return await new Promise<RdaLoteResultado>(async (resolve) => {
        this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
          if (String(returnIdResp) !== String(returnId)) return;

          const resultado: RdaLoteResultado = {
            ok: false,
            accion,
            total: ids?.length ?? 0,
            procesadas: 0,
            exitosas: 0,
            fallidas: ids?.length ?? 0,
            mensaje: mensajeError || 'Error de conexión.',
            resultados: [],
          };

          this.respuestaPinService.updateisLoading(false);
          this.interruptionService.interrupt();

          this.progresoRda.next({
            accion,
            total: resultado.total,
            procesadas: resultado.procesadas,
            exitosas: resultado.exitosas,
            fallidas: resultado.fallidas,
            mensaje: resultado.mensaje,
            ultimoDocumento: null,
            enCurso: false,
          });

          this.cleanupLoteHandlers();
          resolve(resultado);
        };

        this.onProgresoRda = (returnIdResp: string, payload: any) => {
          if (String(returnIdResp) !== String(returnId)) return;

          const prog = this.safeParseProgreso(payload);
          if (!prog) return;
          if (prog.accion !== accion) return;

          this.progresoRda.next(prog);
        };

        const responseHandler = (returnIdResp: string, payload: string) => {
          if (String(returnIdResp) !== String(returnId)) return;

          try {
            const raw = payload
              ? (JSON.parse(payload) as RdaLoteResultadoRaw)
              : {};
            const data = this.normalizeLoteResultado(raw, accion);

            if (responseEvent === 'RespuestaReenviarRdaLote') {
              this.respuestaReenviarRdaLoteEmit.emit(data);
            } else {
              this.respuestaRegenerarRdaLoteEmit.emit(data);
            }

            this.progresoRda.next({
              accion,
              total: data.total,
              procesadas: data.procesadas,
              exitosas: data.exitosas,
              fallidas: data.fallidas,
              mensaje: data.mensaje,
              ultimoDocumento:
                data.resultados?.length > 0
                  ? (data.resultados[data.resultados.length - 1]?.idRda ?? null)
                  : null,
              enCurso: false,
            });

            resolve(data);
          } catch (error) {
            console.error(`Error procesando ${responseEvent}:`, error);

            const resultado: RdaLoteResultado = {
              ok: false,
              accion,
              total: ids?.length ?? 0,
              procesadas: 0,
              exitosas: 0,
              fallidas: ids?.length ?? 0,
              mensaje: 'No fue posible procesar la respuesta del servidor.',
              resultados: [],
            };

            this.progresoRda.next({
              accion,
              total: resultado.total,
              procesadas: resultado.procesadas,
              exitosas: resultado.exitosas,
              fallidas: resultado.fallidas,
              mensaje: resultado.mensaje,
              ultimoDocumento: null,
              enCurso: false,
            });

            resolve(resultado);
          } finally {
            this.respuestaPinService.updateisLoading(false);
            this.cleanupLoteHandlers();
          }
        };

        if (responseEvent === 'RespuestaReenviarRdaLote') {
          this.onRespuestaReenviarRdaLote = responseHandler;
        } else {
          this.onRespuestaRegenerarRdaLote = responseHandler;
        }

        this.signalRService.on('ErrorConexion', this.onErrorConexion);
        this.signalRService.on('ProgresoRda', this.onProgresoRda);

        if (
          responseEvent === 'RespuestaReenviarRdaLote' &&
          this.onRespuestaReenviarRdaLote
        ) {
          this.signalRService.on(
            'RespuestaReenviarRdaLote',
            this.onRespuestaReenviarRdaLote,
          );
        }

        if (
          responseEvent === 'RespuestaRegenerarRdaLote' &&
          this.onRespuestaRegenerarRdaLote
        ) {
          this.signalRService.on(
            'RespuestaRegenerarRdaLote',
            this.onRespuestaRegenerarRdaLote,
          );
        }

        this.respuestaPinService.updateisLoading(true);

        try {
          await this.signalRService.invoke(
            hubMethod,
            sedeId,
            JSON.stringify(ids),
          );
        } catch (err) {
          console.error(`Error al invocar ${hubMethod}:`, err);
          this.respuestaPinService.updateisLoading(false);

          const resultado: RdaLoteResultado = {
            ok: false,
            accion,
            total: ids?.length ?? 0,
            procesadas: 0,
            exitosas: 0,
            fallidas: ids?.length ?? 0,
            mensaje: 'No fue posible iniciar el proceso masivo.',
            resultados: [],
          };

          this.progresoRda.next({
            accion,
            total: resultado.total,
            procesadas: 0,
            exitosas: 0,
            fallidas: resultado.fallidas,
            mensaje: resultado.mensaje,
            ultimoDocumento: null,
            enCurso: false,
          });

          this.cleanupLoteHandlers();
          resolve(resultado);
        }
      });
    } finally {
      this.requestInFlightLote = false;
    }
  }

  private normalizeAccionResultado(
    raw: RdaAccionResultadoRaw,
    idRdaFallback?: number,
  ): RdaAccionResultado {
    return {
      ok: raw.ok ?? raw.Ok ?? false,
      idRda: raw.idRda ?? raw.IdRda ?? idRdaFallback ?? null,
      estado: raw.estado ?? raw.Estado ?? null,
      mensaje: raw.mensaje ?? raw.Mensaje ?? null,
    };
  }

  private normalizeLoteResultado(
    raw: RdaLoteResultadoRaw,
    accionFallback: 'REENVIO_MASIVO' | 'REGENERACION_MASIVA',
  ): RdaLoteResultado {
    const resultadosRaw = raw.resultados ?? raw.Resultados ?? [];

    return {
      ok: raw.ok ?? raw.Ok ?? false,
      accion: raw.accion ?? raw.Accion ?? accionFallback,
      total: Number(raw.total ?? raw.Total ?? 0),
      procesadas: Number(raw.procesadas ?? raw.Procesadas ?? 0),
      exitosas: Number(raw.exitosas ?? raw.Exitosas ?? 0),
      fallidas: Number(raw.fallidas ?? raw.Fallidas ?? 0),
      mensaje: raw.mensaje ?? raw.Mensaje ?? '',
      resultados: resultadosRaw.map((x) => this.normalizeAccionResultado(x)),
    };
  }

  private safeParseProgreso(payload: any): RdaProcesoMasivoProgress | null {
    try {
      const obj = typeof payload === 'string' ? JSON.parse(payload) : payload;
      if (!obj) return null;

      return {
        accion: obj.accion ?? '',
        total: Number(obj.total ?? 0),
        procesadas: Number(obj.procesadas ?? 0),
        exitosas: Number(obj.exitosas ?? 0),
        fallidas: Number(obj.fallidas ?? 0),
        mensaje: obj.mensaje ?? '',
        ultimoDocumento: obj.ultimoDocumento ?? null,
        enCurso:
          typeof obj.enCurso === 'boolean'
            ? obj.enCurso
            : Number(obj.procesadas ?? 0) < Number(obj.total ?? 0),
      };
    } catch {
      return null;
    }
  }

  private cleanupConsultarHandlers(): void {
    if (this.onRespuestaConsultarRda) {
      this.signalRService.off(
        'RespuestaConsultarRdaControl',
        this.onRespuestaConsultarRda,
      );
      this.onRespuestaConsultarRda = undefined;
    }

    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
      this.onErrorConexion = undefined;
    }
  }

  private cleanupReenviarHandlers(): void {
    if (this.onRespuestaReenviarRda) {
      this.signalRService.off(
        'RespuestaReenviarRda',
        this.onRespuestaReenviarRda,
      );
      this.onRespuestaReenviarRda = undefined;
    }

    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
      this.onErrorConexion = undefined;
    }
  }

  private cleanupRegenerarHandlers(): void {
    if (this.onRespuestaRegenerarRda) {
      this.signalRService.off(
        'RespuestaRegenerarRda',
        this.onRespuestaRegenerarRda,
      );
      this.onRespuestaRegenerarRda = undefined;
    }

    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
      this.onErrorConexion = undefined;
    }
  }

  private cleanupLoteHandlers(): void {
    if (this.onRespuestaReenviarRdaLote) {
      this.signalRService.off(
        'RespuestaReenviarRdaLote',
        this.onRespuestaReenviarRdaLote,
      );
      this.onRespuestaReenviarRdaLote = undefined;
    }

    if (this.onRespuestaRegenerarRdaLote) {
      this.signalRService.off(
        'RespuestaRegenerarRdaLote',
        this.onRespuestaRegenerarRdaLote,
      );
      this.onRespuestaRegenerarRdaLote = undefined;
    }

    if (this.onProgresoRda) {
      this.signalRService.off('ProgresoRda', this.onProgresoRda);
      this.onProgresoRda = undefined;
    }

    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
      this.onErrorConexion = undefined;
    }
  }
}
