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
    if (this.ocupado == false) {
      if (this.signalRService.hubConnection.state === this.signalRService.HubConnectionStateConnected) {
        await this.signalRService.hubConnection.stop();
      }
      await this.signalRService.hubConnection.start().then(
        async () => {
          //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
          //aca clienteId 
          this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
            alert('Error de conexion: ' + mensajeError + ' ClienteId: ' + clienteId);
            this.interruptionService.interrupt();

          });

          this.signalRService.hubConnection.on('RespuestaObtenerConsultaPorDiaYPorUnidad', async (clienteId: string, objRespuestaConsultarPorDiaYPorUnidadModel: string) => {
            try {
              const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaConsultarPorDiaYPorUnidadModel);
              this.respuestaConsultarPorDiaYPorUnidadModel.emit(JSON.parse(decompressedData));
              //poner aca lo del isloading
              if(decompressedData != null){
                this.respuestaPinService.updateisLoading(false);
                console.log('terminodecargar');
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
          this.signalRService.hubConnection.invoke('ObtenerConsultaPorDiaYPorUnidad', clienteId, silla, fecha).catch(err => console.error(err));
          this.respuestaPinService.updateisLoading(true);
          console.log('iniciocargar');
          //poner aca lo del isloading
        }).catch(err => console.log('Error al conectar con SignalR: ' + err));
    }
  }

}
