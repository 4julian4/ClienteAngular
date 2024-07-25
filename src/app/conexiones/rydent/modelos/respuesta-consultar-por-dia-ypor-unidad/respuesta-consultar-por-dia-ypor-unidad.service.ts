import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaConsultarPorDiaYPorUnidad } from './respuesta-consultar-por-dia-ypor-unidad.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { RespuestaPinService } from '../respuesta-pin';

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
      if (this.signalRService.hubConnection.state === this.signalRService.HubConnectionStateConnected) {
        await this.signalRService.hubConnection.stop();
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
            this.respuestaConsultarPorDiaYPorUnidadModel.emit(JSON.parse(decompressedData));

            if (decompressedData != null) {
              this.respuestaPinService.updateisLoading(false);
              this.ocupado = false;
              console.log('desocupado');
            }

            await this.signalRService.stopConnection();
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
