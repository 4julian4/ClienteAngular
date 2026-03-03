/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaDatosAdministrativos } from './respuesta-datos-administrativos.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaDatosAdministrativosService {
  @Output() respuestaDatosAdministrativosEmit: EventEmitter<RespuestaDatosAdministrativos[]> = new EventEmitter<RespuestaDatosAdministrativos[]>();
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService
  ) { }

  async startConnectionRespuestaDatosAdministrativos(clienteId: string, idDoctor:number, fechaInicio: Date, fechaFin: Date): Promise<void> {
    try {
      // Asegurar que la conexión está activa
      await this.signalRService.ensureConnection();
  
      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });
  
      this.signalRService.hubConnection.off('RespuestaObtenerDatosAdministrativos');
      this.signalRService.hubConnection.on('RespuestaObtenerDatosAdministrativos', async (clienteId: string, objRespuestaDatosAdministrativosEmit: string) => {
        try {
          // Descomprimir y procesar la respuesta
          //const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaDatosAdministrativosEmit);
          this.respuestaDatosAdministrativosEmit.emit(JSON.parse(objRespuestaDatosAdministrativosEmit));
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });
  
      // Invocar el método en el servidor
      console.log('Invocando método ObtenerDatosAdministrativos...');
      console.log("clienteId:", clienteId, "Tipo:", typeof clienteId);
      console.log("idDoctor:", idDoctor, "Tipo:", typeof idDoctor);
      console.log("fechaInicio:", fechaInicio, "Tipo:", typeof fechaInicio);
      console.log("fechaFin:", fechaFin, "Tipo:", typeof fechaFin);
      await this.signalRService.hubConnection.invoke('ObtenerDatosAdministrativos', clienteId, Number(idDoctor), fechaInicio, fechaFin);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
}*/

// ===============================
// 1) RespuestaDatosAdministrativosService (ALINEADO TARGET/RETURN)
// ===============================
import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaDatosAdministrativos } from './respuesta-datos-administrativos.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';

@Injectable({
  providedIn: 'root',
})
export class RespuestaDatosAdministrativosService {
  @Output() respuestaDatosAdministrativosEmit: EventEmitter<
    RespuestaDatosAdministrativos[]
  > = new EventEmitter<RespuestaDatosAdministrativos[]>();

  // ✅ returnId (connectionId actual del browser)
  private currentReturnId = '';

  // ✅ refs para poder hacer off SOLO a nuestros handlers
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaDatosAdministrativos?: (
    returnId: string,
    payload: any, // ✅ puede venir string u objeto
  ) => void;

  // ✅ opcional: evita doble request
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
  ) {}

  async startConnectionRespuestaDatosAdministrativos(
    sedeId: number, // ✅ TARGET (sede/worker)
    idDoctor: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ returnId del browser (para filtrar eventos)
      this.currentReturnId =
        this.signalRService.hubConnection?.connectionId ?? '';

      // ✅ Limpia SOLO tus handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaDatosAdministrativos) {
        this.signalRService.off(
          'RespuestaObtenerDatosAdministrativos',
          this.onRespuestaDatosAdministrativos,
        );
      }

      // ✅ ErrorConexion (filtrado por returnId)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaObtenerDatosAdministrativos (filtrado por returnId)
      this.onRespuestaDatosAdministrativos = async (
        returnIdResp: string,
        payload: any,
      ) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        try {
          const parsed =
            typeof payload === 'string' ? JSON.parse(payload) : payload;

          if (!parsed) {
            this.respuestaDatosAdministrativosEmit.emit([]);
            return;
          }

          const data: RespuestaDatosAdministrativos[] = Array.isArray(parsed)
            ? parsed
            : [parsed];

          console.log('RespuestaObtenerDatosAdministrativos recibida:', data);
          this.respuestaDatosAdministrativosEmit.emit(data);
        } catch (error) {
          console.error('Error procesando datos administrativos:', error);
          this.respuestaDatosAdministrativosEmit.emit([]);
        }
      };

      this.signalRService.on(
        'RespuestaObtenerDatosAdministrativos',
        this.onRespuestaDatosAdministrativos,
      );

      // ✅ Invocar (TARGET)
      console.log('Invocando ObtenerDatosAdministrativos...');
      console.log('ADMIN -> TARGET enviado:', sedeId);
      console.log('ADMIN -> returnId actual:', this.currentReturnId);
      console.log('idDoctor:', idDoctor);
      console.log('fechaInicio:', fechaInicio);
      console.log('fechaFin:', fechaFin);

      await this.signalRService.invoke(
        'ObtenerDatosAdministrativos',
        sedeId,
        Number(idDoctor),
        fechaInicio,
        fechaFin,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    } finally {
      this.requestInFlight = false;
    }
  }
}
