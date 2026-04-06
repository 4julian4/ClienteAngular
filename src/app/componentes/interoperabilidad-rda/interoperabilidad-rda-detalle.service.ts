import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

@Injectable({
  providedIn: 'root',
})
export class InteroperabilidadRdaDetalleService {
  @Output() respuestaDetalleRdaEmit = new EventEmitter<any>();

  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaDetalleRda?: (returnId: string, payload: string) => void;
  private requestInFlightDetalle = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async consultarDetalle(sedeId: number, idRda: number): Promise<void> {
    if (this.requestInFlightDetalle) return;
    this.requestInFlightDetalle = true;

    try {
      await this.signalRService.ensureConnection();
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      this.cleanupDetalleHandlers();

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        this.respuestaPinService.updateisLoading(false);
        alert('Error de conexión: ' + mensajeError);
        this.interruptionService.interrupt();
        this.cleanupDetalleHandlers();
      };

      this.onRespuestaDetalleRda = (returnIdResp: string, payload: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const raw = payload ? JSON.parse(payload) : null;
          const data = this.normalizarDetalle(raw);
          this.respuestaDetalleRdaEmit.emit(data);
        } catch (error) {
          console.error('Error procesando detalle RDA:', error);
        } finally {
          this.respuestaPinService.updateisLoading(false);
          this.cleanupDetalleHandlers();
        }
      };

      this.signalRService.on('ErrorConexion', this.onErrorConexion);
      this.signalRService.on(
        'RespuestaConsultarDetalleRda',
        this.onRespuestaDetalleRda,
      );

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke('ConsultarDetalleRda', sedeId, idRda);
    } catch (err) {
      console.error('Error al consultar detalle RDA:', err);
      this.respuestaPinService.updateisLoading(false);
      this.cleanupDetalleHandlers();
    } finally {
      this.requestInFlightDetalle = false;
    }
  }

  private cleanupDetalleHandlers(): void {
    if (this.onRespuestaDetalleRda) {
      this.signalRService.off(
        'RespuestaConsultarDetalleRda',
        this.onRespuestaDetalleRda,
      );
      this.onRespuestaDetalleRda = undefined;
    }

    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
      this.onErrorConexion = undefined;
    }
  }

  private normalizarDetalle(raw: any): any {
    if (!raw) return null;

    return {
      ok: raw.ok ?? raw.Ok ?? false,
      mensaje: raw.mensaje ?? raw.Mensaje ?? null,

      ID: raw.ID ?? raw.id ?? 0,
      IDANAMNESIS: raw.IDANAMNESIS ?? raw.idanamnesis ?? 0,
      IDEVOLUCION: raw.IDEVOLUCION ?? raw.idevolucion ?? null,

      FECHA_ATENCION:
        raw.FECHA_ATENCION ?? raw.fechA_ATENCION ?? raw.fechaAtencion ?? null,
      TIPO_DOCUMENTO:
        raw.TIPO_DOCUMENTO ?? raw.tipO_DOCUMENTO ?? raw.tipoDocumento ?? null,
      ESTADO: raw.ESTADO ?? raw.estadO ?? raw.estado ?? null,
      FECHA_GENERACION:
        raw.FECHA_GENERACION ??
        raw.fechA_GENERACION ??
        raw.fechaGeneracion ??
        null,
      FECHA_ENVIO: raw.FECHA_ENVIO ?? raw.fechA_ENVIO ?? raw.fechaEnvio ?? null,
      INTENTOS: raw.INTENTOS ?? raw.intentoS ?? raw.intentos ?? null,
      CODIGO_HTTP: raw.CODIGO_HTTP ?? raw.codigO_HTTP ?? raw.codigoHttp ?? null,
      MENSAJE_ERROR:
        raw.MENSAJE_ERROR ?? raw.mensajE_ERROR ?? raw.mensajeError ?? null,

      NOMBRE_PACIENTE:
        raw.NOMBRE_PACIENTE ??
        raw.nombrE_PACIENTE ??
        raw.nombrePaciente ??
        null,
      DOCUMENTO_PACIENTE:
        raw.DOCUMENTO_PACIENTE ??
        raw.documentO_PACIENTE ??
        raw.documentoPaciente ??
        null,
      NUMERO_HISTORIA:
        raw.NUMERO_HISTORIA ??
        raw.numerO_HISTORIA ??
        raw.numeroHistoria ??
        null,
      DOCTOR: raw.DOCTOR ?? raw.doctoR ?? raw.doctor ?? null,
      FACTURA: raw.FACTURA ?? raw.facturA ?? raw.factura ?? null,

      JSON_RDA: raw.JSON_RDA ?? raw.jsoN_RDA ?? raw.jsonRda ?? null,
      JSON_SNAPSHOT:
        raw.JSON_SNAPSHOT ?? raw.jsoN_SNAPSHOT ?? raw.jsonSnapshot ?? null,
      REQUEST_API: raw.REQUEST_API ?? raw.requesT_API ?? raw.requestApi ?? null,
      RESPUESTA_API:
        raw.RESPUESTA_API ?? raw.respuestA_API ?? raw.respuestaApi ?? null,
    };
  }
}
