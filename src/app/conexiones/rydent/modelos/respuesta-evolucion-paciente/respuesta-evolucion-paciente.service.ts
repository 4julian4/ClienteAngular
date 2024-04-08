import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaEvolucionPaciente } from './respuesta-evolucion-paciente.model';
import { SignalRService } from 'src/app/signalr.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RespuestaEvolucionPacienteService {
 
  @Output() respuestaEvolucionPacienteEmit: EventEmitter<RespuestaEvolucionPaciente[]> = new EventEmitter<RespuestaEvolucionPaciente[]>();

  constructor(
    private signalRService: SignalRService,
  ) { }
  async startConnectionRespuestaEvolucionPaciente(clienteId: string, idAnanesis: string) {
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.on('RespuestaObtenerDatosEvolucion', async (clienteId: string, objRespuestaEvolucionPacienteEmit: string) => {
          this.respuestaEvolucionPacienteEmit.emit(JSON.parse(objRespuestaEvolucionPacienteEmit));
          await this.signalRService.stopConnection();
        });
        this.signalRService.hubConnection.invoke('ObtenerDatosEvolucion', clienteId, idAnanesis).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }

  
}
