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
      // Verificar si la conexión ya está establecida
      if (this.signalRService.hubConnection.state === HubConnectionState.Connected) {
        console.log('La conexión ya está activa. No es necesario reiniciar.');
      } else {
        // Detener la conexión si está en estado de conexión o reconexión
        if (this.signalRService.hubConnection.state === HubConnectionState.Connecting ||
          this.signalRService.hubConnection.state === HubConnectionState.Reconnecting) {
          console.log('Esperando a que finalice la conexión actual...');
          await this.signalRService.hubConnection.stop();
          console.log('Conexión detenida.');
        }

        // Iniciar nueva conexión
        console.log('Iniciando nueva conexión...');
        await this.signalRService.hubConnection.start();
        console.log('Conexión iniciada.');
      }

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaConsultarEstadoCuenta');
      this.signalRService.hubConnection.on('RespuestaConsultarEstadoCuenta', async (clienteId: string, objRespuestaConsultarEstadoCuentaEmit: string) => {
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
      await this.signalRService.hubConnection.invoke('ConsultarEstadoCuenta', clienteId, modeloDatosConsultarEstadoCuenta);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
}
