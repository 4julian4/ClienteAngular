import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { HubConnectionState } from '@microsoft/signalr';
import { Observable, catchError, lastValueFrom, throwError, timeout } from 'rxjs';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { environment } from 'src/environments/environment';
const urlPage = environment.apiUrl +'/auth/authgoogle';

//interfaz para el manejo de la respuesta
export interface PostLoginCallbackGoogleResponse {
  autenticado: boolean;
  respuesta: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginCallbackGoogleService {

  

 

  @Output() respuestaPostLoginCallbackGoogleEmit: EventEmitter<PostLoginCallbackGoogleResponse> = new EventEmitter<PostLoginCallbackGoogleResponse>();

  constructor(
    private httpClient : HttpClient,
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService
  ) { }


  /*async startConnectionPostLoginCallbackGoogle(clienteId: string, code: string, state: string) {
    try {
      console.log('Iniciando proceso de conexión...');

      // Verificar si la conexión está conectada o conectándose, en ese caso detenerla
      if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
        this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
        console.log('Deteniendo conexión existente...');
        await this.signalRService.hubConnection.stop();
        console.log('Conexión detenida.');
      }

      // Esperar hasta que la conexión esté en el estado 'Disconnected'
      while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
        console.log('Esperando a que la conexión esté en estado "Disconnected"... Estado actual: ' + this.signalRService.hubConnection.state);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Iniciar la conexión
      console.log('Iniciando nueva conexión...');
      await this.signalRService.hubConnection.start();
      console.log('Conexión iniciada.');

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaPostLoginCallbackGoogle');
      this.signalRService.hubConnection.on('RespuestaPostLoginCallbackGoogle', async (clienteId: string, objPostLoginCallbackGoogleEmit: string) => {

        let respuesta = JSON.parse(objPostLoginCallbackGoogleEmit);
        await this.signalRService.hubConnection.stop();
        console.log('Conexión detenida después de recibir respuesta.');
        this.respuestaPostLoginCallbackGoogleEmit.emit(respuesta);
        //podriamos hacer algo con la respuesta

        await this.signalRService.stopConnection();
      });
      await this.signalRService.hubConnection.invoke('PostLoginCallbackGoogle', clienteId, code, state).catch(err => console.error(err));
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }*/

  async startConnectionPostLoginCallbackGoogle(clienteId: string, code: string, state: string): Promise<{ autenticado: boolean, respuesta: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Iniciando proceso de conexión...');
  
        // Verificar si la conexión está conectada o conectándose, en ese caso detenerla
        if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
          this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
          console.log('Deteniendo conexión existente...');
          await this.signalRService.hubConnection.stop();
          console.log('Conexión detenida.');
        }
  
        // Esperar hasta que la conexión esté en el estado 'Disconnected'
        while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
          console.log('Esperando a que la conexión esté en estado "Disconnected"... Estado actual: ' + this.signalRService.hubConnection.state);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
  
        // Iniciar la conexión
        console.log('Iniciando nueva conexión...');
        await this.signalRService.hubConnection.start();
        console.log('Conexión iniciada.');
  
        // Configurar eventos de SignalR
        this.signalRService.hubConnection.off('ErrorConexion');
        this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
          console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
          this.interruptionService.interrupt();
          reject(new Error(mensajeError)); // Rechaza la promesa si hay error de conexión.
        });
  
        this.signalRService.hubConnection.off('RespuestaPostLoginCallbackGoogle');
        this.signalRService.hubConnection.on('RespuestaPostLoginCallbackGoogle', async (clienteId: string, objPostLoginCallbackGoogleEmit: string) => {
          try {
            const respuesta = JSON.parse(objPostLoginCallbackGoogleEmit);
            await this.signalRService.hubConnection.stop();
            console.log('Conexión detenida después de recibir respuesta.');
            this.respuestaPostLoginCallbackGoogleEmit.emit(respuesta);
  
            // Resolver la promesa con la respuesta
            resolve({
              autenticado: respuesta.autenticado, // Asumiendo que la respuesta tiene esta propiedad
              respuesta: respuesta.respuesta // Asumiendo que la respuesta tiene esta propiedad
            });
  
            await this.signalRService.stopConnection();
          } catch (error) {
            reject(error); // Rechaza la promesa si hay error al procesar la respuesta
          }
        });
  
        await this.signalRService.hubConnection.invoke('PostLoginCallbackGoogle', clienteId, code, state).catch(err => {
          console.error(err);
          reject(err); // Rechaza la promesa si hay error en la invocación
        });
  
        this.respuestaPinService.updateisLoading(true);
  
      } catch (err) {
        console.log('Error al conectar con SignalR: ' + err);
        reject(err); // Rechaza la promesa si hay error general
      }
    });
  }
  

  

  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  public Post(code: string, state: string) {
    return this.httpClient.post<any>(urlPage, { "code": code, "state": state }, environment.httpOptions)
      .pipe(
        timeout(5000),
        catchError(this.handleError)
      );
  }
}
