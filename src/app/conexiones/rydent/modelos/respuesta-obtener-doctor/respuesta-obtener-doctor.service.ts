import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaObtenerDoctor } from './respuesta-obtener-doctor.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { Router } from '@angular/router';
//import * as signalR from '@microsoft/signalr';
import { HubConnectionState } from '@microsoft/signalr';
//import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaObtenerDoctorService {
  @Output() respuestaObtenerDoctorModel: EventEmitter<RespuestaObtenerDoctor> = new EventEmitter<RespuestaObtenerDoctor>();
  @Output() respuestaObtenerDoctorSiLoCambianModel: EventEmitter<RespuestaObtenerDoctor> = new EventEmitter<RespuestaObtenerDoctor>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private router: Router
  ) { }

  async startConnectionRespuestaObtenerPacientesDoctorSeleccionado(clienteId: string, idDoctor: number): Promise<void> {
    try {
      // Asegurar que la conexión esté activa
      await this.signalRService.ensureConnection();
  
      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });
  
      this.signalRService.hubConnection.off('RespuestaObtenerDoctorSiLoCambian');
      this.signalRService.hubConnection.on('RespuestaObtenerDoctorSiLoCambian', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
        try {
          // Procesar la respuesta recibida
          const response = JSON.parse(objRespuestaObtenerDoctorModel);
          this.respuestaObtenerDoctorSiLoCambianModel.emit(response);
          console.log(response);
          console.log("Total Pacientes: " + response.totalPacientes);
  
          // Detener la conexión si es necesario
          await this.signalRService.stopConnection();
  
          // Navegar a la ruta deseada
          //this.router.routeReuseStrategy.shouldReuseRoute = () => false;
          //this.router.onSameUrlNavigation = 'reload';
          //this.router.navigate(['/']);
        } catch (error) {
          console.error('Error durante el procesamiento de la respuesta: ', error);
        }
      });
  
      // Invocar el método en el servidor
      console.log('Invocando método ObtenerDoctorSiLoCambian...');
      await this.signalRService.hubConnection.invoke('ObtenerDoctorSiLoCambian', clienteId, idDoctor.toString());
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
  

  async startConnectionRespuestaObtenerPacientesDoctorSiLoCambian(clienteId: string, idDoctor: number): Promise<void> {
    try {
      // Asegurar que la conexión esté activa
      await this.signalRService.ensureConnection();
  
      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });
  
      this.signalRService.hubConnection.off('RespuestaObtenerDoctorSiLoCambian');
      this.signalRService.hubConnection.on('RespuestaObtenerDoctorSiLoCambian', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
        try {
          // Procesar la respuesta recibida
          const response = JSON.parse(objRespuestaObtenerDoctorModel);
          this.respuestaObtenerDoctorSiLoCambianModel.emit(response);
          console.log(response);
          console.log("Total Pacientes: " + response.totalPacientes);
  
          // Detener la conexión si es necesario
          await this.signalRService.stopConnection();
  
          // Navegar a la ruta deseada
          this.router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
          };
          this.router.onSameUrlNavigation = 'reload';
          this.router.navigate(['/datos-personales']);
        } catch (error) {
          console.error('Error durante el procesamiento de la respuesta: ', error);
        }
      });
  
      // Invocar el método en el servidor
      console.log('Invocando método ObtenerDoctorSiLoCambian...');
      await this.signalRService.hubConnection.invoke('ObtenerDoctorSiLoCambian', clienteId, idDoctor.toString());
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

}






