import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaRealizarAccionesEnCitaAgendada } from './respuesta-realizar-acciones-en-cita-agendada.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';

@Injectable({
  providedIn: 'root'
})
export class RespuestaRealizarAccionesEnCitaAgendadaService {
  @Output() respuestaRealizarAccionesEnCitaAgendadaEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService
  ) { }

  async startConnectionRespuestaRealizarAccionesEnCitaAgendada(clienteId: string, modelorealizaraccionesencitaagendada: string) {
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
        this.signalRService.hubConnection.on('RespuestaRealizarAccionesEnCitaAgendada', async (clienteId: string, objRespuestaRealizarAccionesEnCitaAgendadaModel: string) => {
          let obj = JSON.parse(objRespuestaRealizarAccionesEnCitaAgendadaModel)
          await this.signalRService.stopConnection();
          this.respuestaRealizarAccionesEnCitaAgendadaEmit.emit(obj);
        });

        this.signalRService.hubConnection.invoke('RealizarAccionesEnCitaAgendada', clienteId, modelorealizaraccionesencitaagendada).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));
  }
}