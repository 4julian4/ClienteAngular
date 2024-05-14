import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaObtenerDoctor } from './respuesta-obtener-doctor.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RespuestaObtenerDoctorService {
  @Output() respuestaObtenerDoctorModel: EventEmitter<RespuestaObtenerDoctor> = new EventEmitter<RespuestaObtenerDoctor>();
  @Output() respuestaObtenerDoctorSiLoCambianModel: EventEmitter<RespuestaObtenerDoctor> = new EventEmitter<RespuestaObtenerDoctor>();
  
  constructor(
    private signalRService:SignalRService,
    private interruptionService: InterruptionService,
    private router: Router
  ) { }

  async startConnectionRespuestaObtenerPacientesDoctorSeleccionado(clienteId: string, idDoctor: number) {
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
        this.signalRService.hubConnection.on('RespuestaObtenerDoctor', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
          this.respuestaObtenerDoctorModel.emit(JSON.parse(objRespuestaObtenerDoctorModel));
          await this.signalRService.stopConnection();
          console.log(JSON.parse(objRespuestaObtenerDoctorModel));
          console.log("Total Pacientes: " + JSON.parse(objRespuestaObtenerDoctorModel).totalPacientes);
        });
        
        this.signalRService.hubConnection.invoke('ObtenerDoctor', clienteId, idDoctor.toString()).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }

  async startConnectionRespuestaObtenerPacientesDoctorSiLoCambian(clienteId: string, idDoctor: number) {
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
        this.signalRService.hubConnection.on('RespuestaObtenerDoctorSiLoCambian', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
          this.respuestaObtenerDoctorSiLoCambianModel.emit(JSON.parse(objRespuestaObtenerDoctorModel));
          await this.signalRService.stopConnection();
          console.log(JSON.parse(objRespuestaObtenerDoctorModel));
          console.log("Total Pacientes: " + JSON.parse(objRespuestaObtenerDoctorModel).totalPacientes);
          this.router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
          };
          
          this.router.onSameUrlNavigation = 'reload';
          this.router.navigate(['/datos-personales']);
        });
        
        this.signalRService.hubConnection.invoke('ObtenerDoctorSiLoCambian', clienteId, idDoctor.toString()).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }
}


