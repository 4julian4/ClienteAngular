import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { Antecedentes } from './antecedentes.model';
import { BehaviorSubject } from 'rxjs';
import { InterruptionService } from 'src/app/helpers/interruption';

@Injectable({
  providedIn: 'root'
})
export class AntecedentesService {
  
  @Output() respuestaAntecedentesEmit: EventEmitter<Antecedentes> = new EventEmitter<Antecedentes>();
  
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService
  ) { }
  async startConnectionRespuestaBusquedaAntecedentes(clienteId: string, idAnanesis: string) {
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
        this.signalRService.hubConnection.on('RespuestaObtenerAntecedentesPaciente', async (clienteId: string, objRespuestaAntecedentesEmit: string) => {
          this.respuestaAntecedentesEmit.emit(JSON.parse(objRespuestaAntecedentesEmit));
          await this.signalRService.stopConnection();
        });
        this.signalRService.hubConnection.invoke('ObtenerAntecedentesPaciente', clienteId, idAnanesis).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }

  

}