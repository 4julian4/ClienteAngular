import { EventEmitter, Injectable, Output } from '@angular/core';
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

  async startConnectionRespuestaDatosAdministrativos(clienteId: string, fechaInicio: Date, fechaFin: Date): Promise<void> {
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
      await this.signalRService.hubConnection.invoke('ObtenerDatosAdministrativos', clienteId, fechaInicio, fechaFin);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
}
