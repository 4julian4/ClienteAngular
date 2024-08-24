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
        withCredentials: false // Desactiva el uso de cookies
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.onclose(() => this.reconnect());
    this.hubConnection.onreconnecting((error) => {
      if (error && error.message.includes('404')) {
        console.warn('Error 404 durante la reconexión. Verifica las rutas de negociación.');
      } else {
        console.warn(`Intentando reconectar: ${error}`);
      }
    });
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
      if (err instanceof Error) {
        if (err.message.includes('404')) {
          console.warn('Error 404 ignorado. La ruta puede no ser crítica.');
        } else {
          console.error('Error al iniciar la conexión: ', err.message);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => this.startConnection(), 5000);
            this.reconnectAttempts++;
          } else {
            console.error('Máximo número de intentos de reconexión alcanzado.');
          }
        }
      } else {
        console.error('Error desconocido al iniciar la conexión:', err);
      }
    }
  }

  async ensureConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected ||
      this.hubConnection.state === signalR.HubConnectionState.Connecting) {
      console.log('Conexión activa o en proceso de conexión. No se necesita reiniciar.');
      return;
    }

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
      if (err instanceof Error) {
        console.error('Error al conectar con SignalR: ', err.message);
      } else {
        console.error('Error desconocido al conectar con SignalR:', err);
      }
      throw err;
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Backoff exponencial
      console.log(`Intento de reconexión #${this.reconnectAttempts} en ${delay} ms`);
      setTimeout(() => this.startConnection(), delay);
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado.');
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      try {
        // Desuscribirse de eventos antes de detener la conexión
        this.hubConnection.off('ErrorConexion');
        this.hubConnection.off('RespuestaAgendarCita');
        await this.hubConnection.stop();
        console.log('Conexión detenida');
      } catch (err) {
        if (err instanceof Error) {
          console.error('Error al detener la conexión: ', err.message);
        } else {
          console.error('Error desconocido al detener la conexión:', err);
        }
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
      if (err instanceof Error) {
        console.error(`Error invocando ${method}: `, err.message);
      } else {
        console.error(`Error desconocido invocando ${method}: `, err);
      }
    }
  }

  async obtenerPin(clienteId: string, pin: string) {
    try {
      await this.hubConnection.invoke('ObtenerPin', clienteId, pin);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error al obtener el pin: ', err.message);
      } else {
        console.error('Error desconocido al obtener el pin: ', err);
      }
    }
  }

  public recibirMensaje(callback: (mensaje: string) => void) {
    this.hubConnection.on('ReceiveMessage', (mensaje: string) => {
      this.mensajeSubject.next(mensaje);
      console.log('Mensaje recibido: ' + mensaje);
      callback(mensaje);
    });
  }
}
