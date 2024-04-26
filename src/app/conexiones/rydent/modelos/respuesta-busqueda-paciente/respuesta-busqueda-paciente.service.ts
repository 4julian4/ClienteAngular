import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaBusquedaPaciente } from './respuesta-busqueda-paciente.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';

@Injectable({
  providedIn: 'root'
})
export class RespuestaBusquedaPacienteService {
  @Output() respuestaBuquedaPacienteModel: EventEmitter<RespuestaBusquedaPaciente[]> = new EventEmitter<RespuestaBusquedaPaciente[]>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService
  ) { }
  async startConnectionRespuestaBusquedaPaciente(clienteId: string, tipoBuqueda: string, valorDeBusqueda: string) {
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
        this.signalRService.hubConnection.on('RespuestaBuscarPaciente', async (clienteId: string, objRespuestaBusquedaPacienteModel: string) => {
          this.respuestaBuquedaPacienteModel.emit(JSON.parse(objRespuestaBusquedaPacienteModel));
          await this.signalRService.stopConnection();
        });
        this.signalRService.hubConnection.invoke('BuscarPaciente', clienteId, tipoBuqueda, valorDeBusqueda).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }
}
