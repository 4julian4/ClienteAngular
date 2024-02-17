import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaPin } from './respuesta-pin.model';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class RespuestaPinService {
  @Output() respuestaPinModel: EventEmitter<RespuestaPin> = new EventEmitter<RespuestaPin>();
  @Output() idSedeActualSignalREmit:  EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private signalRService:SignalRService,
  ) { }

  async startConnectionRespuestaObtenerPin() {
    await this.signalRService.hubConnection
      .start()
      .then(async () =>{
       this.signalRService.hubConnection.on('RespuestaObtenerPin', (clienteId: string, objRespuestaObtenerDoctor: string) => {
          this.respuestaPinModel.emit(JSON.parse(objRespuestaObtenerDoctor));

        }) 
      } )
      .catch(err => console.log('Error al conectar con SignalR: ' + err));
  }
}
