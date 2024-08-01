import { EventEmitter, Injectable, Output } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RespuestaPinService } from './conexiones/rydent/modelos/respuesta-pin';
import { RespuestaObtenerDoctorService } from './conexiones/rydent/modelos/respuesta-obtener-doctor';
import { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'  
})
export class SignalRService {
  public hubConnection: signalR.HubConnection;
  public HubConnectionStateConnected = signalR.HubConnectionState.Connected;
  private mensajeSubject = new Subject<string>();


  mensajes$: Observable<string> = this.mensajeSubject.asObservable();
  doctorSeleccionado: string = "";
  totalPacientesDoctorSeleccionado: number = 0;

  constructor(
    //private respuestaObtenerDoctorService: RespuestaObtenerDoctorService
  ) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        withCredentials: true 
      }) // URL de tu servidor SignalR
      .withAutomaticReconnect() // Habilitar la reconexión automática
      .build();

    this.hubConnection.onclose(() => this.reconnect());

    // Manejar eventos de reconexión
    this.hubConnection.onreconnecting((error) => {
      console.warn(`Intentando reconectar: ${error}`);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log(`Reconectado exitosamente: ${connectionId}`);
    });
  }

  public async startConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected||
      this.hubConnection.state === signalR.HubConnectionState.Connecting) {
      console.log('La conexión ya está en proceso o conectada.');
      return;
    }

    try {
      await this.hubConnection.start();
      console.log('Conexión iniciada');
    } catch (err) {
      // Información detallada del error
      console.error('Error al iniciar la conexión: ', err);

      // Verificar si es un error temporal de red y reintentar después de unos segundos
      if (this.isTemporaryNetworkError(err)) {
        console.log('Error de red temporal detectado. Reintentando en 5 segundos...');
        setTimeout(() => this.startConnection(), 5000);
      } else {
        // Para otros tipos de errores, puede ser útil notificar al usuario o registrar el error para análisis posterior
        this.notifyUserOrLogError(err);
      }
    }
  }

  private notifyUserOrLogError(error: any): void {
    // Notificar al usuario o registrar el error para análisis posterior
    console.error('Error crítico al iniciar la conexión: ', error);
  }

  private isTemporaryNetworkError(error: any): boolean {
    // Implementar lógica para detectar errores temporales de red
    // Por ejemplo, se puede basar en el tipo de error o en el mensaje de error
    return error && error.message && (error.message.includes('network') || error.message.includes('timeout'));
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      console.log('La conexión ya está detenida.');
      return;
    }

    try {
      await this.hubConnection.stop();
      console.log('Connection stopped');
    } catch (err) {
      console.error('Error while stopping connection: ' + err);
    }
  }

  private reconnect(): void {
    setTimeout(() => this.startConnection(), 5000); // Reintentar conexión después de 5 segundos
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.hubConnection.on(event, callback);
  }

  public off(event: string): void {
    this.hubConnection.off(event);
  }

  public async invoke(method: string, ...args: any[]): Promise<void> {
    try {
      await this.hubConnection.invoke(method, ...args);
    } catch (err) {
      console.error(`Error invoking ${method}: `, err);
    }
  }

  async obtenerPin(clienteId: string, pin: string) {
    await this.hubConnection.invoke('ObtenerPin', clienteId, pin)
      .catch(err => console.error(err));
  }

  async enviarMensaje(mensaje: string) {
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


