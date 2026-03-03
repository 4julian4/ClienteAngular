/*import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  public hubConnection: signalR.HubConnection = {} as signalR.HubConnection;
  private mensajeSubject = new Subject<string>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnecting = false;

  mensajes$: Observable<string> = this.mensajeSubject.asObservable();

  constructor() {
    //this.startConnection();
    console.log('SignalRService constructor');
  }

  private async startConnection(): Promise<void> {
    if (
      this.hubConnection.state === signalR.HubConnectionState.Connected ||
      this.hubConnection.state === signalR.HubConnectionState.Connecting
    ) {
      console.log(
        'Conexión ya activa o en proceso de conexión. No se necesita reiniciar.',
      );
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        transport: signalR.HttpTransportType.WebSockets,
        withCredentials: false,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          const delays = [1000, 2000, 5000, 10000, 30000];
          return delays[retryContext.previousRetryCount] || 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.onclose(() => this.reconnect());
    this.hubConnection.onreconnecting((error) => {
      if (error && error.message.includes('404')) {
        console.warn(
          'Error 404 durante la reconexión. Verifica las rutas de negociación.',
        );
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
      console.log(
        `Reintentando conexión en 5 segundos... (Intento #${
          this.reconnectAttempts + 1
        })`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
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
      await new Promise<void>((resolve) => {
        const checkConnectionState = setInterval(() => {
          if (
            this.hubConnection.state === signalR.HubConnectionState.Connected
          ) {
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
      console.log(
        `Intento de reconexión #${this.reconnectAttempts} en ${delay} ms`,
      );
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
      console.warn(
        'No se puede invocar el método. La conexión no está en el estado de conexión.',
      );
      // Puedes optar por intentar reconectar aquí si es necesario.
    }
  }

  async obtenerPin(
    clienteId: string,
    pin: string,
    maxIdAnamnesis: number,
  ): Promise<void> {
    try {
      await this.hubConnection.invoke(
        'ObtenerPin',
        clienteId,
        pin,
        maxIdAnamnesis,
      );
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
}*/
//cambio en el servicio para solucionar error de conexion y reconexion 16-02-2026

// signalr.service.ts
// signalr.service.ts
// ===============================
// SignalRService (DEFINITIVO PRO)
// ===============================
// RUTA: src/app/signalr.service.ts

import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  // ✅ null hasta construir conexión real
  public hubConnection: signalR.HubConnection | null = null;

  private mensajeSubject = new Subject<string>();
  mensajes$: Observable<string> = this.mensajeSubject.asObservable();

  // ✅ evita doble start simultáneo
  private connectionStarting: Promise<void> | null = null;

  // ✅ evita duplicar handler de ReceiveMessage sin tumbar otros
  private receiveMessageHandler?: (mensaje: string) => void;

  constructor() {
    console.log('SignalRService constructor');
  }

  private buildConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        transport: signalR.HttpTransportType.WebSockets,
        withCredentials: false,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          const baseDelays = [1000, 2000, 5000, 10000, 30000];
          const base = baseDelays[ctx.previousRetryCount] ?? 30000;

          // ✅ jitter pequeño (evita reconexiones en “ola”)
          const jitterMax = [300, 500, 800, 1500, 3000];
          const jitter =
            jitterMax[ctx.previousRetryCount] !== undefined
              ? Math.floor(Math.random() * jitterMax[ctx.previousRetryCount]!)
              : Math.floor(Math.random() * 3000);

          return base + jitter;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // ✅ SOLO logs (sin reconexión manual)
    this.hubConnection.onreconnecting((error) => {
      if ((error as any)?.message?.includes?.('404')) {
        console.warn(
          'Error 404 durante la reconexión. Verifica rutas/negociación.',
        );
      } else {
        console.warn(`Intentando reconectar: ${error}`);
      }
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log(`Reconectado exitosamente: ${connectionId}`);
    });

    this.hubConnection.onclose((error) => {
      console.warn('SignalR cerrado.', error);
      // AutomaticReconnect se encarga si corresponde.
      // Si se cerró manual (logout), queda Disconnected.
    });
  }

  private async startConnection(): Promise<void> {
    try {
      if (!this.hubConnection) {
        this.buildConnection();
      }

      const conn = this.hubConnection!;
      if (
        conn.state === signalR.HubConnectionState.Connected ||
        conn.state === signalR.HubConnectionState.Connecting
      ) {
        return;
      }

      await conn.start();
      console.log('Conexión iniciada');
    } catch (err: any) {
      console.error('Error al iniciar la conexión:', err?.message ?? err);
      throw err;
    }
  }

  /**
   * ✅ Método seguro para que 2 llamadas simultáneas no abran 2 veces.
   */
  async ensureConnection(): Promise<void> {
    if (!this.hubConnection) {
      this.buildConnection();
    }

    const conn = this.hubConnection!;
    if (conn.state === signalR.HubConnectionState.Connected) return;

    if (this.connectionStarting) {
      await this.connectionStarting;
      return;
    }

    this.connectionStarting = this.startConnection();
    try {
      await this.connectionStarting;
    } finally {
      this.connectionStarting = null;
    }
  }

  /**
   * ✅ Cerrar SOLO en logout/cerrar sesión.
   * clearHandlers: true -> limpia el handler controlado (ReceiveMessage)
   */
  public async stopConnection(options?: {
    clearHandlers?: boolean;
  }): Promise<void> {
    const conn: any = this.hubConnection;

    if (!conn) return;

    if (typeof conn.stop !== 'function') {
      console.warn('[SignalR] hubConnection inválida en stopConnection:', conn);
      this.hubConnection = null;
      this.connectionStarting = null;
      this.receiveMessageHandler = undefined;
      return;
    }

    try {
      if (conn.state !== signalR.HubConnectionState.Disconnected) {
        await conn.stop();
        console.log('Conexión detenida');
      }
    } catch (err: any) {
      console.error('Error al detener la conexión:', err?.message ?? err);
    } finally {
      if (options?.clearHandlers) {
        this.receiveMessageHandler = undefined;
      }

      // ✅ reset correcto (NO {} )
      this.hubConnection = null;
      this.connectionStarting = null;
    }
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.hubConnection) this.buildConnection();
    this.hubConnection!.on(event, callback);
  }

  /**
   * ✅ off seguro:
   * - con callback: quita SOLO ese callback
   * - sin callback: quita TODOS los callbacks de ese evento (úsalo con cuidado)
   */
  public off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.hubConnection) return;
    if (callback) this.hubConnection.off(event, callback);
    else this.hubConnection.off(event);
  }

  public async invoke(method: string, ...args: any[]): Promise<void> {
    try {
      await this.ensureConnection();
      await this.hubConnection!.invoke(method, ...args);
    } catch (err: any) {
      console.error(`Error invocando ${method}:`, err?.message ?? err);
      throw err;
    }
  }

  // ✅ invoke que RETORNA resultado (no rompe tu invoke actual)
  public async invokeResult<T>(method: string, ...args: any[]): Promise<T> {
    try {
      await this.ensureConnection();
      return await this.hubConnection!.invoke<T>(method, ...args);
    } catch (err: any) {
      console.error(`Error invocando (result) ${method}:`, err?.message ?? err);
      throw err;
    }
  }

  async obtenerPin(
    sedeId: number,
    pin: string,
    maxIdAnamnesis: number,
  ): Promise<void> {
    console.log('PIN -> TARGET enviado:', sedeId);
    console.log('PIN -> returnId actual:', this.hubConnection?.connectionId);

    await this.invoke('ObtenerPin', sedeId, pin, maxIdAnamnesis);
  }

  /**
   * ✅ sin tumbar handlers de otros módulos
   * (solo reemplaza el handler que este servicio controla)
   */
  public recibirMensaje(callback: (mensaje: string) => void) {
    if (!this.hubConnection) this.buildConnection();

    if (this.receiveMessageHandler) {
      this.off('ReceiveMessage', this.receiveMessageHandler);
    }

    this.receiveMessageHandler = (mensaje: string) => {
      this.mensajeSubject.next(mensaje);
      console.log('Mensaje recibido:', mensaje);
      callback(mensaje);
    };

    this.on('ReceiveMessage', this.receiveMessageHandler);
  }
}
