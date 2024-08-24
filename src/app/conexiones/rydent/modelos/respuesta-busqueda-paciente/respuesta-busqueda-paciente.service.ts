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
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaBuscarPaciente');
      this.signalRService.on('RespuestaBuscarPaciente', async (clienteId: string, objRespuestaBusquedaPacienteModel: string) => {
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
      await this.signalRService.invoke('BuscarPaciente', clienteId, tipoBuqueda, valorDeBusqueda);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

}
