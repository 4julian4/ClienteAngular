import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public hubConnection: signalR.HubConnection = {} as signalR.HubConnection;
  private mensajeSubject = new Subject<string>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnecting = false;

  mensajes$: Observable<string> = this.mensajeSubject.asObservable();

  constructor(private http: HttpClient) {
    this.startConnection();
  }

  private async startConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected ||
        this.hubConnection.state === signalR.HubConnectionState.Connecting) {
      console.log('Conexión ya activa o en proceso de conexión. No se necesita reiniciar.');
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        transport: signalR.HttpTransportType.WebSockets,
        withCredentials: false
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          const delays = [1000, 2000, 5000, 10000, 30000];
          return delays[retryContext.previousRetryCount] || 30000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
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
      this.reconnecting = false;
    });

    try {
      await this.hubConnection.start();
      console.log('Conexión iniciada');
      this.reconnectAttempts = 0;
    } catch (err) {
      this.handleConnectionError(err);
    }
  }

  private async handleConnectionError(err: any): Promise<void> {
    console.error('Error al iniciar la conexión: ', err.message);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Reintentando conexión en 5 segundos... (Intento #${this.reconnectAttempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      this.reconnectAttempts++;
      await this.startConnection();
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado.');
    }
  }

  async ensureConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('Conexión ya activa.');
      return;
    }

    if (this.hubConnection.state === signalR.HubConnectionState.Connecting) {
      console.log('Conexión en proceso, esperando...');
      await new Promise<void>(resolve => {
        const checkConnectionState = setInterval(() => {
          if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
            clearInterval(checkConnectionState);
            resolve();
          }
        }, 1000);
      });
      return;
    }

    try {
      await this.startConnection();
    } catch (err) {
      this.handleConnectionError(err);
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnecting) {
      console.log('Reconexión ya en curso.');
      return;
    }

    this.reconnecting = true;
    console.log('Iniciando proceso de reconexión...');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`Intento de reconexión #${this.reconnectAttempts} en ${delay} ms`);
      setTimeout(async () => {
        await this.startConnection();
        this.reconnecting = false;
      }, delay);
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado.');
      this.reconnecting = false;
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
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke(method, ...args);
      } catch (err) {
        if (err instanceof Error) {
          console.error(`Error invocando ${method}: `, err.message);
        } else {
          console.error(`Error desconocido invocando ${method}: `, err);
        }
      }
    } else {
      console.warn('No se puede invocar el método. La conexión no está en el estado de conexión.');
      // Puedes optar por intentar reconectar aquí si es necesario.
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