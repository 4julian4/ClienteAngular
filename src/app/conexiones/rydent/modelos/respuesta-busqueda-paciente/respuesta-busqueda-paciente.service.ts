import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaBusquedaPaciente } from './respuesta-busqueda-paciente.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaBusquedaPacienteService {
  @Output() respuestaBuquedaPacienteModel: EventEmitter<RespuestaBusquedaPaciente[]> = new EventEmitter<RespuestaBusquedaPaciente[]>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }
  async startConnectionRespuestaBusquedaPaciente(clienteId: string, tipoBuqueda: string, valorDeBusqueda: string): Promise<void> {
    try {
      // Verificar si la conexión ya está establecida
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

      this.signalRService.hubConnection.off('RespuestaBuscarPaciente');
      this.signalRService.hubConnection.on('RespuestaBuscarPaciente', async (clienteId: string, objRespuestaBusquedaPacienteModel: string) => {
        try {
          // Descomprimir y procesar la respuesta
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaBusquedaPacienteModel);
          this.respuestaBuquedaPacienteModel.emit(JSON.parse(decompressedData));
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });

      // Invocar el método en el servidor
      console.log('Invocando método BuscarPaciente...');
      await this.signalRService.hubConnection.invoke('BuscarPaciente', clienteId, tipoBuqueda, valorDeBusqueda);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

}
