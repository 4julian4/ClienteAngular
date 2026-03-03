/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaConsultarPorDiaYPorUnidad } from './respuesta-consultar-por-dia-ypor-unidad.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { RespuestaPinService } from '../respuesta-pin';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaConsultarPorDiaYPorUnidadService {
  @Output() respuestaConsultarPorDiaYPorUnidadModel: EventEmitter<RespuestaConsultarPorDiaYPorUnidad> = new EventEmitter<RespuestaConsultarPorDiaYPorUnidad>();
  ocupado: boolean = false;
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService
  ) { }

  async startConnectionRespuestaConsultarPorDiaYPorUnidad(clienteId: string, silla: string, fecha: Date): Promise<void> {
    try {
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaObtenerConsultaPorDiaYPorUnidad');
      this.signalRService.on('RespuestaObtenerConsultaPorDiaYPorUnidad', async (clienteId: string, objRespuestaConsultarPorDiaYPorUnidadModel: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaConsultarPorDiaYPorUnidadModel);
          this.respuestaConsultarPorDiaYPorUnidadModel.emit(JSON.parse(decompressedData));

          if (decompressedData != null) {
            this.respuestaPinService.updateisLoading(false);
            this.ocupado = false;
            console.log('Desocupado');
          }
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });

      this.ocupado = true;
      console.log('Ocupado');
      // Invocar el método en el servidor
      console.log('Invocando método ObtenerConsultaPorDiaYPorUnidad...');
      await this.signalRService.invoke('ObtenerConsultaPorDiaYPorUnidad', clienteId, silla, fecha);
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
}*/
// ===============================
// 1) RespuestaConsultarPorDiaYPorUnidadService (ALINEADO TARGET/RETURN)
// ===============================
import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaConsultarPorDiaYPorUnidad } from './respuesta-consultar-por-dia-ypor-unidad.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { RespuestaPinService } from '../respuesta-pin';

@Injectable({
  providedIn: 'root',
})
export class RespuestaConsultarPorDiaYPorUnidadService {
  @Output()
  respuestaConsultarPorDiaYPorUnidadModel: EventEmitter<RespuestaConsultarPorDiaYPorUnidad> =
    new EventEmitter<RespuestaConsultarPorDiaYPorUnidad>();

  ocupado: boolean = false;

  // ✅ returnId (connectionId actual del browser)
  private currentReturnId = '';

  // ✅ refs para poder hacer off SOLO a nuestros handlers
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuesta?: (returnId: string, payload: string) => void;

  // ✅ opcional: evita doble request simultánea
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async startConnectionRespuestaConsultarPorDiaYPorUnidad(
    sedeId: number, // ✅ antes clienteId: este es el TARGET (sede/worker)
    silla: string,
    fecha: Date,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ returnId actual (browser)
      this.currentReturnId =
        this.signalRService.hubConnection?.connectionId ?? '';

      // ==============================
      // ✅ ErrorConexion (filtrado por returnId)
      // ==============================
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.interruptionService.interrupt();
      };

      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ===============================================
      // ✅ RespuestaObtenerConsultaPorDiaYPorUnidad (returnId)
      // ===============================================
      if (this.onRespuesta) {
        this.signalRService.off(
          'RespuestaObtenerConsultaPorDiaYPorUnidad',
          this.onRespuesta,
        );
      }

      this.onRespuesta = (returnIdResp: string, payload: string) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        try {
          const decompressedData =
            this.descomprimirDatosService.decompressString(payload);

          this.respuestaConsultarPorDiaYPorUnidadModel.emit(
            JSON.parse(decompressedData),
          );
        } catch (error) {
          console.error(
            'Error durante la descompresión o el procesamiento:',
            error,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);
          this.ocupado = false;
          console.log('Desocupado');
        }
      };

      this.signalRService.on(
        'RespuestaObtenerConsultaPorDiaYPorUnidad',
        this.onRespuesta,
      );

      // ==============================
      // ✅ Invoke (TARGET)
      // ==============================
      this.ocupado = true;
      console.log('Ocupado');
      this.respuestaPinService.updateisLoading(true);

      console.log('Invocando método ObtenerConsultaPorDiaYPorUnidad...');
      console.log('CONSULTA -> TARGET enviado:', sedeId);
      console.log('CONSULTA -> returnId actual:', this.currentReturnId);

      await this.signalRService.invoke(
        'ObtenerConsultaPorDiaYPorUnidad',
        sedeId,
        silla,
        fecha,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
      this.ocupado = false;
    } finally {
      this.requestInFlight = false;
    }
  }
}
