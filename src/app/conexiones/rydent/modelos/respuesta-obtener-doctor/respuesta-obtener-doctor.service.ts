import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaObtenerDoctor } from './respuesta-obtener-doctor.model';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class RespuestaObtenerDoctorService {
  @Output() respuestaObtenerDoctorModel: EventEmitter<RespuestaObtenerDoctor> = new EventEmitter<RespuestaObtenerDoctor>();
  
  constructor(
    private signalRService:SignalRService,
  ) { }
  async startConnectionRespuestaObtenerPacientesDoctorSeleccionado(clienteId: string, idDoctor: number) {
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.on('RespuestaObtenerDoctor', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
          this.respuestaObtenerDoctorModel.emit(JSON.parse(objRespuestaObtenerDoctorModel));
          await this.signalRService.stopConnection();
          console.log(JSON.parse(objRespuestaObtenerDoctorModel));
          console.log("Total Pacientes: " + JSON.parse(objRespuestaObtenerDoctorModel).totalPacientes);
        });
        this.signalRService.hubConnection.invoke('ObtenerDoctor', clienteId, idDoctor).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }
}
