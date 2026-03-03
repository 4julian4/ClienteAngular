/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { DatosPersonales } from './datos-personales.model';
import { BehaviorSubject } from 'rxjs';
import { RespuestaDatosPersonales } from '../respuesta-datos-personales';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class DatosPersonalesService {

  @Output() respuestaDatosPersonalesEmit: EventEmitter<RespuestaDatosPersonales> = new EventEmitter<RespuestaDatosPersonales>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }



  async startConnectionRespuestaDatosPersonales(clienteId: string, idAnanesis: string): Promise<void> {
    try {
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaObtenerDatosPersonalesCompletosPaciente');
      this.signalRService.on('RespuestaObtenerDatosPersonalesCompletosPaciente', async (clienteId: string, objRespuestaDatosPersonalesEmit: string) => {
        try {
          // Descomprimir y procesar la respuesta
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaDatosPersonalesEmit);
          this.respuestaDatosPersonalesEmit.emit(JSON.parse(decompressedData));
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });

      // Invocar el método en el servidor
      console.log('Invocando método ObtenerDatosPersonalesCompletosPaciente...');
      await this.signalRService.invoke('ObtenerDatosPersonalesCompletosPaciente', clienteId, idAnanesis);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

}*/

import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { RespuestaDatosPersonales } from '../respuesta-datos-personales';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

@Injectable({
  providedIn: 'root',
})
export class DatosPersonalesService {
  @Output()
  respuestaDatosPersonalesEmit: EventEmitter<RespuestaDatosPersonales> =
    new EventEmitter<RespuestaDatosPersonales>();

  // ✅ referencias para poder hacer off SOLO a nuestros handlers
  private onErrorConexion?: (clienteId: string, mensajeError: string) => void;
  private onRespuestaDatosPersonales?: (
    clienteId: string,
    payload: string,
  ) => void;

  // ✅ opcional: evita doble request simultáneo
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
  ) {}

  /**
   * targetId = idActualSignalR (SEDE / destino)
   * el HUB responderá con returnId = hubConnection.connectionId (browser)
   */
  async startConnectionRespuestaDatosPersonales(
    sedeId: number,
    idAnanesis: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ RETURN-ID real del browser (para filtrar respuestas)
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      // ✅ Limpia SOLO tus handlers anteriores (si existían)
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaDatosPersonales) {
        this.signalRService.off(
          'RespuestaObtenerDatosPersonalesCompletosPaciente',
          this.onRespuestaDatosPersonales,
        );
      }

      // ✅ ErrorConexion (filtrado por returnId)
      this.onErrorConexion = (clienteIdResp: string, mensajeError: string) => {
        if (String(clienteIdResp) !== String(returnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + clienteIdResp,
        );
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ Respuesta... (filtrado por returnId)
      this.onRespuestaDatosPersonales = async (
        clienteIdResp: string,
        payloadComprimido: string,
      ) => {
        if (String(clienteIdResp) !== String(returnId)) return;

        try {
          const decompressedData =
            this.descomprimirDatosService.decompressString(payloadComprimido);

          this.respuestaDatosPersonalesEmit.emit(
            JSON.parse(decompressedData) as RespuestaDatosPersonales,
          );
        } catch (error) {
          console.error('Error procesando respuesta datos personales:', error);
        }
      };

      this.signalRService.on(
        'RespuestaObtenerDatosPersonalesCompletosPaciente',
        this.onRespuestaDatosPersonales,
      );

      console.log('Invocando ObtenerDatosPersonalesCompletosPaciente...');
      console.log('DATOS -> sedeId enviado:', sedeId);
      console.log('DATOS -> returnId actual:', returnId);

      // ✅ invocas con sedeId (sede)
      await this.signalRService.invoke(
        'ObtenerDatosPersonalesCompletosPaciente',
        sedeId,
        idAnanesis,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    } finally {
      this.requestInFlight = false;
    }
  }
}
