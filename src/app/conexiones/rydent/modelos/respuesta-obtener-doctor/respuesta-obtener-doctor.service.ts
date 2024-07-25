import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaObtenerDoctor } from './respuesta-obtener-doctor.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { Router } from '@angular/router';
import { HubConnectionState } from '@microsoft/signalr';

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
    // Detener la conexión si está en estado 'Connected' o 'Connecting'
    if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
      this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
      console.log('La conexión está conectada o conectándose, intentando detener...');
      await this.signalRService.hubConnection.stop();
    }

    // Esperar hasta que la conexión esté en el estado 'Disconnected'
    while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
      console.log('Esperando que la conexión esté en el estado "Disconnected"...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('Conexión en estado "Disconnected", intentando iniciar...');

    await this.signalRService.hubConnection.start().then(
      async () => {
        console.log('Conexión iniciada correctamente.');
        // Configurar eventos de SignalR
        this.signalRService.hubConnection.off('ErrorConexion');
        this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
          alert('Error de conexion: ' + mensajeError + ' ClienteId: ' + clienteId);
          this.interruptionService.interrupt();
        });

        this.signalRService.hubConnection.off('RespuestaObtenerDoctor');
        this.signalRService.hubConnection.on('RespuestaObtenerDoctor', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
          await this.signalRService.stopConnection();


          while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
            console.log('Esperando que la conexión esté en el estado "Disconnected"...');
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          console.log('Conexión en estado "Disconnected", intentando iniciar...');
          this.respuestaObtenerDoctorModel.emit(JSON.parse(objRespuestaObtenerDoctorModel));
          console.log(JSON.parse(objRespuestaObtenerDoctorModel));
          console.log("Total Pacientes: " + JSON.parse(objRespuestaObtenerDoctorModel).totalPacientes);
        });

        // Invocar el método SignalR
        console.log('Invocando método ObtenerDoctor...');
        this.signalRService.hubConnection.invoke('ObtenerDoctor', clienteId, idDoctor.toString()).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));
  }


  async startConnectionRespuestaObtenerPacientesDoctorSiLoCambian(clienteId: string, idDoctor: number) {
    // Verificar si la conexión está conectada o conectándose, en ese caso detenerla
    if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
      this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
      console.log('La conexión está conectada o conectándose, intentando detener...');
      await this.signalRService.hubConnection.stop();
    }

    // Esperar hasta que la conexión esté en el estado 'Disconnected'
    while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
      console.log('Esperando que la conexión esté en el estado "Disconnected"...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Conexión en estado "Disconnected", intentando iniciar...');
    await this.signalRService.hubConnection.start().then(
      async () => {
        console.log('Conexión iniciada correctamente.');

        // Configurar eventos de SignalR
        this.signalRService.hubConnection.off('ErrorConexion');
        this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
          alert('Error de conexion: ' + mensajeError + ' ClienteId: ' + clienteId);
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
          this.router.navigate(['/datos-personales']);
        });

        // Invocar el método SignalR
        console.log('Invocando método ObtenerDoctorSiLoCambian...');
        this.signalRService.hubConnection.invoke('ObtenerDoctorSiLoCambian', clienteId, idDoctor.toString()).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));
  }


}


