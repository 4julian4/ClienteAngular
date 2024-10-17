import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { HubConnectionState } from '@microsoft/signalr';
import { Observable, lastValueFrom } from 'rxjs';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { environment } from 'src/environments/environment';
const urlPage = environment.apiUrl +'/auth/';

//interfaz para el manejo de la respuesta
export interface PostLoginCallbackResponse {
  autenticado: boolean;
  respuesta: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginCallBackService {

  @Output() respuestaPostLoginCallbackEmit: EventEmitter<PostLoginCallbackResponse> = new EventEmitter<PostLoginCallbackResponse>();

  constructor(
    private httpClient : HttpClient,
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService
  ) { }

  public async Post(code : string, state : string): Promise<any>{
    const categories$ =  this.httpClient.post<any>(urlPage, {"code":code, "state" : state} , environment.httpOptions);
    return await lastValueFrom(categories$);
  }

  async startConnectionPostLoginCallback(clienteId: string, code: string, state: string): Promise<{ autenticado: boolean, respuesta: string }> {
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
  
        this.signalRService.hubConnection.off('RespuestaPostLoginCallback');
        this.signalRService.hubConnection.on('RespuestaPostLoginCallback', async (clienteId: string, objPostLoginCallbackEmit: string) => {
          try {
            const respuesta = JSON.parse(objPostLoginCallbackEmit);
            await this.signalRService.hubConnection.stop();
            console.log('Conexión detenida después de recibir respuesta.');
            this.respuestaPostLoginCallbackEmit.emit(respuesta);
            console.log('Respuesta recibida: ' + JSON.stringify(respuesta));
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
  
        await this.signalRService.hubConnection.invoke('PostLoginCallback', clienteId, code, state).catch(err => {
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
}
