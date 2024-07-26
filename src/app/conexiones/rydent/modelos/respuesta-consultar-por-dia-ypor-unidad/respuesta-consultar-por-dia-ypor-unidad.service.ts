import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaConsultarPorDiaYPorUnidad } from './respuesta-consultar-por-dia-ypor-unidad.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { RespuestaPinService } from '../respuesta-pin';
import { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaConsultarPorDiaYPorUnidadService {
  @Output() respuestaConsultarPorDiaYPorUnidadModel: EventEmitter<RespuestaConsultarPorDiaYPorUnidad> = new EventEmitter<RespuestaConsultarPorDiaYPorUnidad>();
  ocupado: boolean = false;
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService
  ) { }

  async startConnectionRespuestaConsultarPorDiaYPorUnidad(clienteId: string, silla: string, fecha: Date) {
    console.log(this.ocupado);
    if (!this.ocupado) {
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

        this.signalRService.hubConnection.off('RespuestaObtenerConsultaPorDiaYPorUnidad');
        this.signalRService.hubConnection.on('RespuestaObtenerConsultaPorDiaYPorUnidad', async (clienteId: string, objRespuestaConsultarPorDiaYPorUnidadModel: string) => {
          try {
            const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaConsultarPorDiaYPorUnidadModel);
            await this.signalRService.stopConnection();
            this.respuestaConsultarPorDiaYPorUnidadModel.emit(JSON.parse(decompressedData));

            if (decompressedData != null) {
              this.respuestaPinService.updateisLoading(false);
              this.ocupado = false;
              console.log('desocupado');
            }

            
          } catch (error) {
            console.error('Error during decompression or parsing: ', error);
          }
        });

        this.ocupado = true;
        console.log('ocupado');
        await this.signalRService.hubConnection.invoke('ObtenerConsultaPorDiaYPorUnidad', clienteId, silla, fecha);
        this.respuestaPinService.updateisLoading(true);
      } catch (err) {
        console.log('Error al conectar con SignalR: ' + err);
      }
    }
  }


}
