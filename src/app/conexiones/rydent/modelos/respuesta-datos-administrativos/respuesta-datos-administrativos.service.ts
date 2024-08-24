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

  async startConnectionRespuestaDatosAdministrativos(clienteId: string, fechaInicio: Date, fechaFin: Date) {
    try {
      if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
        this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
        
        console.log('Conexión activa o en proceso de conexión. No se necesita reiniciar.');
    } else {
        console.log('Iniciando conexión a SignalR...');

        try {
            await this.signalRService.hubConnection.start();
            console.log('Conexión a SignalR establecida.');
        } catch (err) {
            console.log('Error al conectar con SignalR: ' + err);
            return; // Salir si hay un error al iniciar la conexión
        }
    }

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaObtenerDatosAdministrativos');
      this.signalRService.hubConnection.on('RespuestaObtenerDatosAdministrativos', async (clienteId: string, objRespuestaDatosAdministrativosEmit: string) => {
        this.respuestaDatosAdministrativosEmit.emit(JSON.parse(objRespuestaDatosAdministrativosEmit));
      });

      // Invocar el método en el servidor
      console.log('Invocando método ObtenerDatosAdministrativos...');
      await this.signalRService.hubConnection.invoke('ObtenerDatosAdministrativos', clienteId, fechaInicio, fechaFin);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }

  }
}
