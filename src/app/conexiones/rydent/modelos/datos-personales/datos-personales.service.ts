import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { DatosPersonales } from './datos-personales.model';
import { BehaviorSubject } from 'rxjs';
import { RespuestaDatosPersonales } from '../respuesta-datos-personales';

@Injectable({
  providedIn: 'root'
})
export class DatosPersonalesService {
  
  @Output() respuestaDatosPersonalesEmit: EventEmitter<RespuestaDatosPersonales> = new EventEmitter<RespuestaDatosPersonales>();

  constructor(
    private signalRService: SignalRService,
  ) { }

 

  async startConnectionRespuestaDatosPersonales(clienteId: string, idAnanesis: string) {
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.on('RespuestaObtenerDatosPersonalesCompletosPaciente', async (clienteId: string, objRespuestaDatosPersonalesEmit: string) => {
          this.respuestaDatosPersonalesEmit.emit(JSON.parse(objRespuestaDatosPersonalesEmit));
          await this.signalRService.stopConnection();
        });
        this.signalRService.hubConnection.invoke('ObtenerDatosPersonalesCompletosPaciente', clienteId, idAnanesis).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }
}