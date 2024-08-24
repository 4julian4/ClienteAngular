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
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  mensajes$: Observable<string> = this.mensajeSubject.asObservable();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        withCredentials: true 
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.onclose(() => this.reconnect());
    this.hubConnection.onreconnecting((error) => console.warn(`Intentando reconectar: ${error}`));
    this.hubConnection.onreconnected((connectionId) => {
      console.log(`Reconectado exitosamente: ${connectionId}`);
      this.reconnectAttempts = 0;
    });

    this.startConnection();
  }

  private async startConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('La conexión ya está activa.');
      return;
    }

    try {
      await this.hubConnection.start();
      console.log('Conexión iniciada');
      this.reconnectAttempts = 0;
    } catch (err) {
      console.error('Error al iniciar la conexión: ', err);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.startConnection(), 5000);
        this.reconnectAttempts++;
      } else {
        console.error('Máximo número de intentos de reconexión alcanzado.');
      }
    }
  }

  async ensureConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected ||
        this.hubConnection.state === signalR.HubConnectionState.Connecting) {
      console.log('Conexión activa o en proceso de conexión. No se necesita reiniciar.');
      return;
    }

    // Detener la conexión si está en estado de reconexión
    if (this.hubConnection.state === signalR.HubConnectionState.Reconnecting) {
      console.log('Esperando a que finalice la reconexión actual...');
      await this.hubConnection.stop();
      console.log('Conexión detenida.');
    }

    console.log('Iniciando nueva conexión...');
    try {
      await this.hubConnection.start();
      console.log('Conexión a SignalR establecida.');
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
      throw err; // Lanza el error para que pueda ser manejado por el llamador
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intento de reconexión #${this.reconnectAttempts}`);
      await this.startConnection();
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado.');
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      try {
        await this.hubConnection.stop();
        console.log('Conexión detenida');
      } catch (err) {
        console.error('Error al detener la conexión: ', err);
      }
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
