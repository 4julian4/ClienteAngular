import { EventEmitter, Injectable, Output } from '@angular/core';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { RespuestaConsultarEstadoCuenta } from './respuesta-consultar-estado-cuenta.model';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaConsultarEstadoCuentaService {
  @Output() respuestaConsultarEstadoCuentaEmit: EventEmitter<RespuestaConsultarEstadoCuenta[]> = new EventEmitter<RespuestaConsultarEstadoCuenta[]>();
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }

  async startConnectionRespuestaConsultarEstadoCuenta(clienteId: string, modeloDatosConsultarEstadoCuenta: string): Promise<void> {
    try {
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaConsultarEstadoCuenta');
      this.signalRService.on('RespuestaConsultarEstadoCuenta', async (clienteId: string, objRespuestaConsultarEstadoCuentaEmit: string) => {
        try {
          // Descomprimir y procesar la respuesta
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaConsultarEstadoCuentaEmit);
          this.respuestaConsultarEstadoCuentaEmit.emit(JSON.parse(decompressedData));
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });

      // Invocar el método en el servidor
      console.log('Invocando método ConsultarEstadoCuenta...');
      await this.signalRService.invoke('ConsultarEstadoCuenta', clienteId, modeloDatosConsultarEstadoCuenta);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
}
