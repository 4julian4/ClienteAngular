import { EventEmitter, Injectable, Output } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RespuestaPinService } from './conexiones/rydent/modelos/respuesta-pin';
import { RespuestaObtenerDoctorService } from './conexiones/rydent/modelos/respuesta-obtener-doctor';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public hubConnection: signalR.HubConnection;
  private mensajeSubject = new Subject<string>();


  mensajes$: Observable<string> = this.mensajeSubject.asObservable();
  doctorSeleccionado: string = "";
  totalPacientesDoctorSeleccionado: number = 0;

  constructor(
    //private respuestaObtenerDoctorService: RespuestaObtenerDoctorService
  ) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl) // URL de tu servidor SignalR
      .build();
  }


  
  async stopConnection() {
    await this.hubConnection
      .stop()
      .then(() => console.log('Conexión con SignalR cerrada'))
      .catch(err => console.log('Error al cerrar la conexión con SignalR: ' + err));
  }


  async obtenerPin(clienteId: string, pin: string) {
    await this.hubConnection.invoke('ObtenerPin', clienteId, pin)
      .catch(err => console.error(err));
  }

  enviarMensaje(mensaje: string) {

    this.hubConnection.invoke('ObtenerPin', mensaje, '123')
      .catch(err => console.error(err));
    return this.hubConnection
      .invoke('SendMessage', this.hubConnection.connectionId, mensaje)
      .catch(err => console.error(err));
  }

  recibirMensaje(callback: (mensaje: string) => void) {
    this.hubConnection.on('ReceiveMessage', (mensaje: string) => {
      this.mensajeSubject.next(mensaje);
      console.log('Mensaje recibido: ' + mensaje);
      callback(mensaje);

    });
  }


}


