import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaConsultarPorDiaYPorUnidad } from './respuesta-consultar-por-dia-ypor-unidad.model';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class RespuestaConsultarPorDiaYPorUnidadService {
  @Output() respuestaConsultarPorDiaYPorUnidadModel: EventEmitter<RespuestaConsultarPorDiaYPorUnidad> = new EventEmitter<RespuestaConsultarPorDiaYPorUnidad>();
  constructor(private signalRService:SignalRService) { }

  async startConnectionRespuestaConsultarPorDiaYPorUnidad(clienteId: string, silla:string, fecha: Date) {
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.on('RespuestaObtenerConsultaPorDiaYPorUnidad', async (clienteId: string, objRespuestaConsultarPorDiaYPorUnidadModel: string) => {
          this.respuestaConsultarPorDiaYPorUnidadModel.emit(JSON.parse(objRespuestaConsultarPorDiaYPorUnidadModel));
          await this.signalRService.stopConnection();
        });
        
        this.signalRService.hubConnection.invoke('ObtenerConsultaPorDiaYPorUnidad', clienteId, silla, fecha).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }

}
