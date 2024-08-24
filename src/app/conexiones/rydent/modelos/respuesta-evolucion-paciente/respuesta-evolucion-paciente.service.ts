import { EventEmitter, Injectable, Output } from '@angular/core';
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
  


}
