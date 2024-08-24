import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public hubConnection: signalR.HubConnection;
  private mensajeSubject = new Subject<string>();

  mensajes$: Observable<string> = this.mensajeSubject.asObservable();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
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
      this.reconnectAttempts = 0; // Reiniciar intentos después de reconexión exitosa
    });

    // Iniciar la conexión cuando se construye el servicio
    this.startConnection();
  }

  public async startConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected ||
        this.hubConnection.state === signalR.HubConnectionState.Connecting) {
      console.log('La conexión ya está en proceso o conectada.');
      return;
    }

    try {
      await this.hubConnection.start();
      console.log('Conexión iniciada');
      this.reconnectAttempts = 0; // Reinicia el contador al conectar
    } catch (err) {
      console.error('Error al iniciar la conexión: ', err);

      if (this.isTemporaryNetworkError(err)) {
        console.log('Error de red temporal detectado. Reintentando en 5 segundos...');
        setTimeout(() => this.startConnection(), 5000);
      } else {
        this.notifyUserOrLogError(err);
      }
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intento de reconexión #${this.reconnectAttempts}`);
      setTimeout(() => this.startConnection(), 5000); // Reintentar conexión después de 5 segundos
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado.');
      this.notifyUserOrLogError('Conexión perdida. No se pudo reconectar.');
    }
  }

  private notifyUserOrLogError(error: any): void {
    console.error('Error crítico al iniciar la conexión: ', error);
    // Aquí puedes notificar al usuario o registrar el error para análisis posterior
  }

  private isTemporaryNetworkError(error: any): boolean {
    return error && error.message && (error.message.includes('network') || error.message.includes('timeout'));
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      console.log('La conexión ya está detenida.');
      return;
    }

    try {
      await this.hubConnection.stop();
      console.log('Conexión detenida');
    } catch (err) {
      console.error('Error al detener la conexión: ', err);
    }
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
      console.error(`Error invocando ${method}: `, err);
    }
  }

  async obtenerPin(clienteId: string, pin: string) {
    await this.hubConnection.invoke('ObtenerPin', clienteId, pin)
      .catch(err => console.error(err));
  } 

  public recibirMensaje(callback: (mensaje: string) => void) {
    this.hubConnection.on('ReceiveMessage', (mensaje: string) => {
      this.mensajeSubject.next(mensaje);
      console.log('Mensaje recibido: ' + mensaje);
      callback(mensaje);
    });
  }
}
