import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

@Injectable({
  providedIn: 'root',
})
export class InteroperabilidadRdaHistorialService {
  @Output() respuestaHistorialRdaEmit = new EventEmitter<any>();

  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaHistorialRda?: (returnId: string, payload: string) => void;
  private requestInFlightHistorial = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async consultarHistorial(sedeId: number, idRda: number): Promise<void> {
    if (this.requestInFlightHistorial) return;
    this.requestInFlightHistorial = true;

    try {
      await this.signalRService.ensureConnection();
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      this.cleanupHistorialHandlers();

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        this.respuestaPinService.updateisLoading(false);
        alert('Error de conexión: ' + mensajeError);
        this.interruptionService.interrupt();
        this.cleanupHistorialHandlers();
      };

      this.onRespuestaHistorialRda = (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const data = payload ? JSON.parse(payload) : { ok: false, items: [] };
          this.respuestaHistorialRdaEmit.emit(data);
        } catch (error) {
          console.error('Error procesando historial RDA:', error);
        } finally {
          this.respuestaPinService.updateisLoading(false);
          this.cleanupHistorialHandlers();
        }
      };

      this.signalRService.on('ErrorConexion', this.onErrorConexion);
      this.signalRService.on(
        'RespuestaConsultarHistorialRda',
        this.onRespuestaHistorialRda,
      );

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke('ConsultarHistorialRda', sedeId, idRda);
    } catch (err) {
      console.error('Error al consultar historial RDA:', err);
      this.respuestaPinService.updateisLoading(false);
      this.cleanupHistorialHandlers();
    } finally {
      this.requestInFlightHistorial = false;
    }
  }

  private cleanupHistorialHandlers(): void {
    if (this.onRespuestaHistorialRda) {
      this.signalRService.off(
        'RespuestaConsultarHistorialRda',
        this.onRespuestaHistorialRda,
      );
      this.onRespuestaHistorialRda = undefined;
    }

    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
      this.onErrorConexion = undefined;
    }
  }
}
