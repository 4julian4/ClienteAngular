import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaDatosAdministrativos } from './respuesta-datos-administrativos.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';

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
    if (this.signalRService.hubConnection.state === this.signalRService.HubConnectionStateConnected) {
      await this.signalRService.hubConnection.stop();
    }
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.off('ErrorConexion');
        this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
          alert('Error de conexion: ' + mensajeError + ' ClienteId: ' + clienteId);
          this.interruptionService.interrupt();
  
        });
        this.signalRService.hubConnection.off('RespuestaObtenerDatosAdministrativos');
        this.signalRService.hubConnection.on('RespuestaObtenerDatosAdministrativos', async (clienteId: string, objRespuestaDatosAdministrativosEmit: string) => {
          this.respuestaDatosAdministrativosEmit.emit(JSON.parse(objRespuestaDatosAdministrativosEmit));
          await this.signalRService.stopConnection();
        });
        this.signalRService.hubConnection.invoke('ObtenerDatosAdministrativos', clienteId, fechaInicio, fechaFin).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }
}
