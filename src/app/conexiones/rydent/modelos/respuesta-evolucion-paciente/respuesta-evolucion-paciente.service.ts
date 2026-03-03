/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaEvolucionPaciente } from './respuesta-evolucion-paciente.model';
import { SignalRService } from 'src/app/signalr.service';
import { BehaviorSubject } from 'rxjs';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import signalR, { HubConnectionState } from '@microsoft/signalr';
import { RespuestaPinService } from '../respuesta-pin';

@Injectable({
  providedIn: 'root'
})
export class RespuestaEvolucionPacienteService {

  @Output() respuestaEvolucionPacienteEmit: EventEmitter<RespuestaEvolucionPaciente[]> = new EventEmitter<RespuestaEvolucionPaciente[]>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService
  ) { }


  async startConnectionRespuestaEvolucionPaciente(clienteId: string, idAnanesis: string): Promise<void> {
    try {
      // Asegurar que la conexión está activa
      await this.signalRService.ensureConnection();
  
      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });
  
      this.signalRService.hubConnection.off('RespuestaObtenerDatosEvolucion');
      this.signalRService.hubConnection.on('RespuestaObtenerDatosEvolucion', async (clienteId: string, objRespuestaEvolucionPacienteEmit: string) => {
        try {
          // Descomprimir y procesar la respuesta
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaEvolucionPacienteEmit);
          this.respuestaEvolucionPacienteEmit.emit(JSON.parse(decompressedData));
          if (decompressedData != null) {
            this.respuestaPinService.updateisLoading(false);
          }
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });
  
      // Invocar el método en el servidor
      console.log('Invocando método ObtenerDatosEvolucion...');
      await this.signalRService.hubConnection.invoke('ObtenerDatosEvolucion', clienteId, idAnanesis);
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
  


}*/

import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaEvolucionPaciente } from './respuesta-evolucion-paciente.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { RespuestaPinService } from '../respuesta-pin';

@Injectable({
  providedIn: 'root',
})
export class RespuestaEvolucionPacienteService {
  @Output() respuestaEvolucionPacienteEmit: EventEmitter<
    RespuestaEvolucionPaciente[]
  > = new EventEmitter<RespuestaEvolucionPaciente[]>();

  // ✅ handlers propios para off seguro
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaObtenerDatosEvolucion?: (
    returnId: string,
    payload: string,
  ) => void;

  // ✅ evita doble request simultáneo
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async startConnectionRespuestaEvolucionPaciente(
    sedeId: number, // <-- TARGET (idSedeActualSignalR / idActualSignalR)
    idAnanesis: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ RETURN-ID real del browser
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      console.log('EVOLUCION -> TARGET enviado:', sedeId);
      console.log('EVOLUCION -> RETURN-ID actual:', returnId);

      // ✅ Limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaObtenerDatosEvolucion) {
        this.signalRService.off(
          'RespuestaObtenerDatosEvolucion',
          this.onRespuestaObtenerDatosEvolucion,
        );
      }

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );

        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaObtenerDatosEvolucion (filtrado por RETURN-ID)
      this.onRespuestaObtenerDatosEvolucion = async (
        returnIdResp: string,
        objRespuestaEvolucionPacienteEmit: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const decompressedData =
            this.descomprimirDatosService.decompressString(
              objRespuestaEvolucionPacienteEmit,
            );

          if (!decompressedData) return;

          this.respuestaEvolucionPacienteEmit.emit(
            JSON.parse(decompressedData) as RespuestaEvolucionPaciente[],
          );
        } catch (error) {
          console.error(
            'Error durante la descompresión o el procesamiento:',
            error,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);
        }
      };

      this.signalRService.on(
        'RespuestaObtenerDatosEvolucion',
        this.onRespuestaObtenerDatosEvolucion,
      );

      console.log('Invocando método ObtenerDatosEvolucion...');
      this.respuestaPinService.updateisLoading(true);

      // ✅ invoke al HUB: clienteId = TARGET
      await this.signalRService.invoke(
        'ObtenerDatosEvolucion',
        sedeId,
        idAnanesis,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlight = false;
    }
  }
}
