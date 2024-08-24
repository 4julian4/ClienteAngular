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

  async startConnectionRespuestaObtenerPacientesDoctorSeleccionado(clienteId: string, idDoctor: number) {
    try {
      // Detener la conexión si está en estado 'Connected' o 'Connecting'
      if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
        this.signalRService.hubConnection.state === HubConnectionState.Connecting) {

        console.log('Conexión activa o en proceso de conexión. No se necesita reiniciar.');
      } else {
        console.log('Iniciando conexión a SignalR...');

        try {
          await this.signalRService.hubConnection.start();
          console.log('Conexión a SignalR establecida.');
        } catch (err) {
          console.log('Error al conectar con SignalR: ' + err);
          return; // Salir si hay un error al iniciar la conexión
        }
      }

      // Configurar los eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaObtenerDoctorSiLoCambian');
      this.signalRService.hubConnection.on('RespuestaObtenerDoctorSiLoCambian', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
        this.respuestaObtenerDoctorSiLoCambianModel.emit(JSON.parse(objRespuestaObtenerDoctorModel));
        await this.signalRService.stopConnection();
        console.log(JSON.parse(objRespuestaObtenerDoctorModel));
        console.log("Total Pacientes: " + JSON.parse(objRespuestaObtenerDoctorModel).totalPacientes);

        // Navegar a la ruta deseada
        this.router.routeReuseStrategy.shouldReuseRoute = function () {
          return false;
        };
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate(['/']);
      });

      // Invocar el método SignalR
      console.log('Invocando método ObtenerDoctorSiLoCambian...');
      this.signalRService.hubConnection.invoke('ObtenerDoctorSiLoCambian', clienteId, idDoctor.toString()).catch(err => console.error(err));
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }

  async startConnectionRespuestaObtenerPacientesDoctorSiLoCambian(clienteId: string, idDoctor: number) {
    try {
      // Detener la conexión si está en estado 'Connected' o 'Connecting'
      if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
        this.signalRService.hubConnection.state === HubConnectionState.Connecting) {

        console.log('Conexión activa o en proceso de conexión. No se necesita reiniciar.');
      } else {
        console.log('Iniciando conexión a SignalR...');

        try {
          await this.signalRService.hubConnection.start();
          console.log('Conexión a SignalR establecida.');
        } catch (err) {
          console.log('Error al conectar con SignalR: ' + err);
          return; // Salir si hay un error al iniciar la conexión
        }
      }

      // Configurar los eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaObtenerDoctorSiLoCambian');
      this.signalRService.hubConnection.on('RespuestaObtenerDoctorSiLoCambian', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
        this.respuestaObtenerDoctorSiLoCambianModel.emit(JSON.parse(objRespuestaObtenerDoctorModel));
        await this.signalRService.stopConnection();
        console.log(JSON.parse(objRespuestaObtenerDoctorModel));
        console.log("Total Pacientes: " + JSON.parse(objRespuestaObtenerDoctorModel).totalPacientes);

        // Navegar a la ruta deseada
        this.router.routeReuseStrategy.shouldReuseRoute = function () {
          return false;
        };
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate(['/']);
      });

      // Invocar el método SignalR
      console.log('Invocando método ObtenerDoctorSiLoCambian...');
      this.signalRService.hubConnection.invoke('ObtenerDoctorSiLoCambian', clienteId, idDoctor.toString()).catch(err => console.error(err));
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }

}






