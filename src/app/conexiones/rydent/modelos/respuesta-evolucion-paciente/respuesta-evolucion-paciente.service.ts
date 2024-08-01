import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaEvolucionPaciente } from './respuesta-evolucion-paciente.model';
import { SignalRService } from 'src/app/signalr.service';
import { BehaviorSubject } from 'rxjs';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { HubConnectionState } from '@microsoft/signalr';
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
  
  
  async startConnectionRespuestaEvolucionPaciente(clienteId: string, idAnanesis: string) {
    if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
      this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
      console.log('Deteniendo conexión existente...');
      await this.signalRService.hubConnection.stop();
      console.log('Conexión detenida.');
    }

    // Esperar hasta que la conexión esté en el estado 'Disconnected'
    while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
      console.log('Esperando a que la conexión esté en estado "Disconnected"... Estado actual: ' + this.signalRService.hubConnection.state);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    try {
      await this.signalRService.hubConnection.start();
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexion: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaObtenerDatosEvolucion');
      this.signalRService.hubConnection.on('RespuestaObtenerDatosEvolucion', async (clienteId: string, objRespuestaEvolucionPacienteEmit: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaEvolucionPacienteEmit);
          await this.signalRService.stopConnection();
          this.respuestaEvolucionPacienteEmit.emit(JSON.parse(decompressedData));
          if (decompressedData != null) {
            this.respuestaPinService.updateisLoading(false);
          }
        } catch (error) {
          console.error('Error during decompression or parsing: ', error);
        }
      });
      await this.signalRService.hubConnection.invoke('ObtenerDatosEvolucion', clienteId, idAnanesis).catch(err => console.error(err));
      this.respuestaPinService.updateisLoading(true);
    }  catch (err) {
        console.log('Error al conectar con SignalR: ' + err);
    }

  }


}
